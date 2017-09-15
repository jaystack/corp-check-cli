import { join, normalize } from 'path';

export const resolvePath = path => {
  if (/^\./.test(path)) {
    return normalize(join(process.cwd(), path));
  }

  return path;
};

export const resolvePackagePath = path => {
  const resolvedPath = resolvePath(path);

  if (/\.json$/.test(resolvedPath)) {
    return resolvedPath;
  }

  return join(resolvedPath, 'package.json')
};
