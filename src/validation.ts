import { CORPCHECK_ENDPOINT } from './constants';
import * as request from 'request-promise-native';
import { logger } from './logger';

export const get = async (endpoint): Promise<any> => {
  logger.info('get', endpoint);
  return await request({
    uri: `${CORPCHECK_ENDPOINT}${endpoint}`,
    json: true
  });
};

export const post = async (endpoint, body): Promise<any> => {
  logger.info('post', endpoint, JSON.stringify(body, null, 2));
  return await request({
    method: 'POST',
    uri: `${CORPCHECK_ENDPOINT}${endpoint}`,
    json: true,
    body
  });
};

export const getEvaluation = async (cid): Promise<any> => {
  logger.info('getEvaluation', cid);
  return await request({
    uri: `${CORPCHECK_ENDPOINT}/package?cid=${cid}`,
    json: true
  });
};

export const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));
export const waitToEvaluation = async (cid): Promise<any> => {
  let result: any = await getEvaluation(cid);
  logger.debug('waitToEvaluation', JSON.stringify(result, null, 4));
  while (result && result.state.type && result.state.type === 'PENDING') {
    await sleep(3000);
    result = await getEvaluation(cid);
    logger.debug('waitToEvaluation', JSON.stringify(result, null, 4));
  }

  return result;
};

export const validate_module = async (name, config = {}) => {
  const validationResult = await post(`/validation`, { packageName: name, ...config });
  logger.debug('validationResult', JSON.stringify(validationResult, null, 4));

  return await waitToEvaluation(validationResult.cid);
};

export const validate_package = async (packageJSON, config = {}) => {
  const validationResult = await post(`/validation`, { packageJSON, ...config });
  logger.debug('validationResult', JSON.stringify(validationResult, null, 4));

  return await waitToEvaluation(validationResult.cid);
};
