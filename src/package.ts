import { RequestHandler } from 'express';
import { ls } from 'npm-remote-ls';
import { treeify } from 'json-toy';
import got from "got";

import { NPMPackage } from './types';

const als = (name, version) =>
  new Promise((resolve, reject) => {
    try {
      ls(name, version, false, (data) => {
        resolve(data[`${name}@${version}`]);
      })
    } catch (e) {
      reject(e);
    }
  });

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
export const getPackage: RequestHandler = async function (req, res, next) {
  const { name, version, html } = req.params;

  try {
    // reinstate exact registry fetch as als doesn't actually throw
    const npmPackage: NPMPackage = await got(
        `https://registry.npmjs.org/${name}/${version}`,
    ).json();

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
    next(error);
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
