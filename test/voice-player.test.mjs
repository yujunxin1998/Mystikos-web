import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

let playerTools = {}
try {
  playerTools = await import('../app/utils/voice-player.mjs')
} catch {
  // RED 阶段允许目标模块尚不存在；每个用例仍以行为断言失败，而不是加载错误退出。
}

const { formatPlaybackTime, nextVoicePlaybackAction, playbackProgress, shouldHandleVoiceMediaEvent, transitionVoicePlayback } = playerTools

const contrastRatio = (foreground, background) => {
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/.{2}/g).map(channel => Number.parseInt(channel, 16) / 255)
    const linear = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  }
  const first = luminance(foreground)
  const second = luminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

test('语音播放器把媒体秒数格式化为稳定的分秒显示', () => {
  assert.equal(typeof formatPlaybackTime, 'function')
  assert.equal(formatPlaybackTime(Number.NaN), '0:00')
  assert.equal(formatPlaybackTime(-10), '0:00')
  assert.equal(formatPlaybackTime(0), '0:00')
  assert.equal(formatPlaybackTime(65.9), '1:05')
  assert.equal(formatPlaybackTime(3599), '59:59')
})

test('语音波形进度始终限制在零到百分之百', () => {
  assert.equal(typeof playbackProgress, 'function')
  assert.equal(playbackProgress(15, 60), 25)
  assert.equal(playbackProgress(-1, 60), 0)
  assert.equal(playbackProgress(70, 60), 100)
  assert.equal(playbackProgress(10, 0), 0)
  assert.equal(playbackProgress(Number.NaN, 60), 0)
})

test('点击当前语音会暂停，点击另一条会切换播放目标', () => {
  assert.equal(typeof nextVoicePlaybackAction, 'function')
  assert.deepEqual(nextVoicePlaybackAction(null, 1, false), { command: 'play', nextActiveIndex: 1 })
  assert.deepEqual(nextVoicePlaybackAction(1, 1, true), { command: 'pause', nextActiveIndex: null })
  assert.deepEqual(nextVoicePlaybackAction(1, 2, false), { command: 'play', nextActiveIndex: 2 })
})

test('媒体事件把语音状态稳定地切换为加载、播放、失败和空闲', () => {
  assert.equal(typeof transitionVoicePlayback, 'function')
  assert.equal(transitionVoicePlayback('idle', 'request'), 'loading')
  assert.equal(transitionVoicePlayback('error', 'request'), 'loading')
  assert.equal(transitionVoicePlayback('loading', 'playing'), 'playing')
  assert.equal(transitionVoicePlayback('playing', 'waiting'), 'loading')
  assert.equal(transitionVoicePlayback('loading', 'failure'), 'error')
  assert.equal(transitionVoicePlayback('playing', 'pause'), 'idle')
  assert.equal(transitionVoicePlayback('playing', 'ended'), 'idle')
})

test('同一音频重试时忽略上一轮排队中的媒体事件', () => {
  assert.equal(typeof shouldHandleVoiceMediaEvent, 'function')
  const current = { activeIndex: 1, eventIndex: 1 }

  assert.equal(shouldHandleVoiceMediaEvent({ ...current, event: 'pause', paused: false }), false)
  assert.equal(shouldHandleVoiceMediaEvent({ ...current, event: 'pause', paused: true }), true)
  assert.equal(shouldHandleVoiceMediaEvent({ ...current, event: 'ended', ended: false }), false)
  assert.equal(shouldHandleVoiceMediaEvent({ ...current, event: 'ended', ended: true }), true)
  assert.equal(shouldHandleVoiceMediaEvent({ ...current, event: 'error', hasMediaError: false }), false)
  assert.equal(shouldHandleVoiceMediaEvent({ ...current, event: 'error', hasMediaError: true }), true)
  assert.equal(shouldHandleVoiceMediaEvent({ ...current, event: 'abort', reloading: true }), false)
  assert.equal(shouldHandleVoiceMediaEvent({ ...current, event: 'abort', reloading: false }), true)
  assert.equal(shouldHandleVoiceMediaEvent({ activeIndex: 2, eventIndex: 1, event: 'pause', paused: true }), false)
})

test('浅色语音播放器的文字和焦点颜色达到可访问对比度', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')
  const lightTheme = css.match(/\.site-shell\[data-theme="light"\]\s+\.club-skin\s*\{[^}]*\}/)?.[0] || ''
  const muted = lightTheme.match(/--club-voice-muted:\s*(#[0-9a-f]{6})/i)?.[1]
  const focus = lightTheme.match(/--club-focus:\s*(#[0-9a-f]{6})/i)?.[1]

  assert.ok(muted)
  assert.ok(focus)
  assert.ok(contrastRatio(muted, '#f6f2fc') >= 4.5)
  assert.ok(contrastRatio(focus, '#f6f2fc') >= 3)
  assert.ok(contrastRatio(focus, '#fffdf9') >= 3)
})

test('窄屏语音播放器明确固定首行控件和第二行波形', async () => {
  const css = await readFile(new URL('../app/assets/css/companion-club.css', import.meta.url), 'utf8')

  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.public-companion-profile\.club-skin \.club-voice-player\s*\{[^}]*grid-template-areas:\s*"toggle meta speaker"\s*"\. wave wave"/)
  assert.match(css, /\.club-voice-speaker\s*\{[^}]*grid-area:\s*speaker/)
  assert.match(css, /\.club-voice-wave\s*\{[^}]*grid-area:\s*wave/)
})
