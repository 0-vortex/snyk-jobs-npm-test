import { RequestHandler } from 'express';
import { ls } from 'npm-remote-ls';

const als = (name, version) => {
  return new Promise((resolve, reject) => {
    ls(name, version, false, (data, err) => {
      if (err) {
        reject({
          error: true,
          message: err,
        });
      } else {
        resolve(data[`${name}@${version}`]);
      }
    });
  });
}

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version } = req.params;

  try {
    const dependencies = await als(name, version);

    return res.status(200).json({
      name,
      version,
      dependencies,
    });
  } catch (error) {
    return next(error);
  }
};
