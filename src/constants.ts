export const WEBSITEURL = 'http://corp-check.jaystack.com';

export const getApiEndpoint = () => {
  switch (process.env.ENV) {
    case 'dev':
      return 'https://nriy2mztj9.execute-api.eu-central-1.amazonaws.com/dev';
    case 'stage':
      return 'https://ol8w3589yc.execute-api.eu-central-1.amazonaws.com/stage';
    case 'prod':
    default:
      return 'https://6r92ru84n2.execute-api.eu-central-1.amazonaws.com/prod';
  }
};

export const getWebEndpoint = () => {
  switch (process.env.ENV) {
    case 'dev':
      return 'http://corp-check.dev.jaystack.com';
    case 'stage':
      return 'http://corp-check.stage.jaystack.com';
    case 'prod':
    default:
      return 'http://corp-check.jaystack.com';
  }
};

export const NPM_PACKAGE_NAME_PATTERN = /^((@([^@]+)\/)?([^@]+))(@(.*))?$/;
