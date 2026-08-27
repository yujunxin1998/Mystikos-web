// Mystikos 部署安全配置。
// 部署时可直接编辑此文件调整默认值；也可通过同名 NUXT_ 环境变量覆盖（见 .env.example）。
export interface MystikosSecurityConfig {
  // 密码登录 RSA 非对称加密开关。
  // true  = 开启：登录前获取后端公钥，密码以 RSA-OAEP / SHA-256 加密后提交（生产默认）。
  // false = 关闭：密码按明文提交，仅用于后端同样关闭非对称加密的联调 / 测试环境。
  passwordEncryptionEnabled: boolean
}

const securityConfig: MystikosSecurityConfig = {
  passwordEncryptionEnabled: true,
}

export default securityConfig
