import { RequestHandler } from 'express';
import { ls } from 'npm-remote-ls';
import { treeify } from 'json-toy';

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
  const { name, version, html } = req.params;

  try {
    const dependencies = await als(name, version);
    const body = {
      name,
      version,
      dependencies,
    };

    if (html === undefined) {
      return res.status(200).json(body);
    } else {
      return res.status(200).render('tree', {
        title: `${name}@${version}`,
        data: treeify(body),
      });
    }
  } catch (error) {
    return next(error);
  }
};

export const getPackageHTML: RequestHandler = async function (req, res, next) {
  return getPackage(<any>{
    ...req,
    params: {
      ...req.params,
      html: "true",
    },
  }, res, next);
}
