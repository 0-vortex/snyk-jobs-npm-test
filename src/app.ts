import * as express from 'express';
import * as path from 'path';
import { getPackage, getPackageHTML } from './package';

/**
 * Bootstrap the application framework
 */
export function createApp() {
  const app = express();

  app.set("view engine", "pug");
  app.set("views", path.join(__dirname, '../views'));

  app.use(express.json());

  app.get('/package/:name/:version', getPackage);
  app.get('/package/:name/:version/html', getPackageHTML);

  return app;
}
