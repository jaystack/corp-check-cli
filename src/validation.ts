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

export const post = async (endpoint, packageJSON): Promise<any> => {
  logger.info('post', endpoint);
  return await request({
    method: 'POST',
    uri: `${CORPCHECK_ENDPOINT}${endpoint}`,
    json: true,
    body: {
      packageJSON
    }
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
  while (result.item && result.item.validationState && result.item.validationState.state === 'PENDING') {
    await sleep(3000);
    result = await getEvaluation(cid);
    logger.debug('waitToEvaluation', JSON.stringify(result, null, 4));
  }

  return result
};

export const validate_module = async (name, version) => {
  const params = [ `name=${name}` ];
  if (version) params.push(`version=${version}`);

  var validationResult = await get(`/validation?${params.join('&')}`);
  logger.debug('validationResult', JSON.stringify(validationResult, null, 4));

  return await waitToEvaluation(validationResult.cid);
};

export const validate_package = async packageJSON => {
  var validationResult = await post(`/validation`, packageJSON);
  logger.debug('validationResult', JSON.stringify(validationResult, null, 4));

  return await waitToEvaluation(validationResult.cid);
};
