import 'jsonwebtoken'

declare module "jsonwebtoken" {
  export interface JwtPayload {
    userId?: number;
  }
}
