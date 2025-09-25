export const jwtConstants = {
  secret:
    process.env.JWT_SECRET ||
    '51b05d8a692e3d6aa77bd7fdcf74f52278a64b9f6546726d4fbcc487ee05c76859b86b2764e67f4298ed31571af682915af6133fe14dd6a671b0ec2a261d4f31',
  expiresIn: '1h',
};
