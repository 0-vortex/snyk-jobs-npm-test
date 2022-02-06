import { RequestHandler } from 'express';
import { ls } from 'npm-remote-ls';
import { treeify } from 'json-toy';
import got from "got";
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';

import { NPMPackage } from './types';

const offset = 5 * 60 * 1000;

const checkCache = (name, version) => {
  try {
    const now = new Date().getTime();
    const file = JSON.parse(readFileSync(`./.cache/${name}/${version}/manifest.json`, 'utf8'));

    const diff = now - new Date(file.lastCached).getTime();

    return diff > offset ? false : file;
  } catch (e) {
    return false;
  }
}

const checkDirExists = (name) => {
  try {
    statSync(`./cache/${name}`);

    return true;
  } catch (e) {
    return false;
  }
}

const cacheBody = (name, version, body) => {
  try {
    if (!checkDirExists(name)) {
      mkdirSync(`./.cache/${name}/${version}`, {
        recursive: true
      });
    }

    writeFileSync(`./.cache/${name}/${version}/manifest.json`, body);
  } catch (e) {
    console.log(e);
    return false;
  }

  return true;
}

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
  const now = new Date();

  const cacheManifest = checkCache(name, version);
  delete cacheManifest.lastCached;

  if (cacheManifest) {
    console.log('cached response');
    if (html === undefined) {
      return res.status(200).json(cacheManifest);
    } else {
      return res.status(200).render('tree', {
        title: `${name}@${version}`,
        data: treeify(cacheManifest),
      });
    }
  }

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

    cacheBody(name, version, JSON.stringify({
      ...body,
      lastCached: now.toISOString(),
    }));

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
