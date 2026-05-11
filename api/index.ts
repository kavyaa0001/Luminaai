export default async function handler(req: any, res: any) {
  const { default: app } = await import('../artifacts/api-server/src/index.js');
  return app(req, res);
}
