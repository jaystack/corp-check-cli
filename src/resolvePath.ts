import { join, normalize } from 'path';
import { readFile } from 'fs';

export const resolvePath = path => {
  if (/^\./.test(path)) {
    return normalize(join(process.cwd(), path));
  }

  return path;
};

export const resolveFilePath = (path, filename) => {
  const resolvedPath = resolvePath(path);

  if (/\.json$/.test(resolvedPath)) {
    return resolvedPath;
  }

  return join(resolvedPath, filename);
};

export const resolvePackagePath = path => {
  return resolveFilePath(path, 'package.json');
};

// export const resolveRuleSetPath = (path, filename = 'corp-check-rules.json') => {
//   return resolveFilePath(path, filename);
// };

export const readfile = (path: string, file: string): Promise<string> => {
  const filePath = resolveFilePath(path, file);
  return new Promise((resolve, reject) => {
    readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return resolve(null);
      }
      resolve(data);
    });
  });
};
