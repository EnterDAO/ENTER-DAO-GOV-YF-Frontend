import React from 'react';
import Spin from 'antd/lib/spin';
import { BigNumber } from 'bignumber.js';
import { getEtherscanTxUrl } from 'web3/utils';
import { Web3SendState } from 'web3/web3Contract';

import Button from 'components/antd/button';
import Modal, { ModalProps } from 'components/antd/modal';
import ExternalLink from 'components/custom/externalLink';
import Icon from 'components/custom/icon';
import { Text } from 'components/custom/typography';
import { EnterToken } from 'components/providers/known-tokens-provider';
import { formatBigNumber } from 'modules/redeem/views/redeem-page';
import etherscanLink from 'resources/png/etherscan-link.svg';
import success from 'resources/svg/success.svg';
import warning from 'resources/svg/warning-3.svg';

type Props = ModalProps & {
  state?: Web3SendState;
  txHash?: string;
  renderProgress?: () => React.ReactNode;
  renderSuccess?: () => React.ReactNode;
  redeemableAmountETH?: string;
  redeemableAmountTokens?: string;
  isRedeem?: boolean;
};

const TxStatusModal: React.FC<Props> = props => {
  const {
    state,
    txHash,
    renderProgress,
    renderSuccess,
    redeemableAmountETH,
    redeemableAmountTokens,
    isRedeem = false,
    ...modalProps
  } = props;

  return (
    <Modal {...modalProps}>
      <div className="grid flow-row pv-8 ph-8">
        {state === 'progress' && (
          <>
            <Icon name="static/tx-progress" width={180} height={160} className="mb-32 mh-auto" />
            <Text type="h3" weight="semibold" color="primary" className="mb-16 text-center">
              Your transaction is being processed ...
            </Text>
            <div className="mb-64">{renderProgress?.()}</div>
            <ExternalLink href={getEtherscanTxUrl(txHash)} className="button-primary full-width">
              View on Etherscan
            </ExternalLink>
          </>
        )}
        {state === 'success' &&
          (isRedeem ? (
            <div className="flex flow-row align-center">
              <img src={success} alt="" style={{ width: '110px', height: '128px' }} />
              <div>
                <Text
                  style={{ fontSize: '24px', fontWeight: '400', color: 'white' }}
                  type="h3"
                  weight="semibold"
                  color="primary"
                  className="mb-16 text-center">
                  Success
                </Text>
                <Text
                  style={{ fontSize: '12px', fontWeight: '400', color: 'white' }}
                  type="small"
                  weight="semibold"
                  color="secondary"
                  className="mb-16 text-center">
                  You have successfully redeemed{' '}
                  {redeemableAmountTokens === '0' ? (
                    <Spin />
                  ) : (
                    formatBigNumber(new BigNumber(redeemableAmountTokens!).unscaleBy(EnterToken.decimals)!)
                  )}{' '}
                  ENTR for {redeemableAmountETH === '0' ? <Spin /> : redeemableAmountETH} ETH
                </Text>
                <ExternalLink
                  style={{
                    color: 'white',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '400',
                  }}
                  href={getEtherscanTxUrl(txHash!)}>
                  View on Etherscan
                  <img
                    width={16}
                    height={16}
                    src={etherscanLink}
                    alt="etherscan link img"
                    style={{ marginLeft: '6px' }}
                  />
                </ExternalLink>
                {renderSuccess?.()}
              </div>
            </div>
          ) : (
            <>
              <Icon name="tx-success" width={180} height={160} className="mb-32 mh-auto" />
              <Text type="h3" weight="semibold" color="primary" className="mb-16 text-center">
                Congratulations!
              </Text>
              <Text type="small" weight="semibold" color="secondary" className="mb-16 text-center">
                Your transaction was successful.
              </Text>
              {renderSuccess?.()}
            </>
          ))}
        {state === 'fail' &&
          (isRedeem ? (
            <div className="flex flow-row align-center">
              <img
                width={16}
                height={16}
                src={warning}
                alt="etherscan link img"
                style={{ width: '110px', height: '128px' }}
              />
              <div>
                <Text
                  type="h3"
                  weight="semibold"
                  color="primary"
                  className="mb-16 text-center"
                  style={{ fontSize: '24px', fontWeight: '400' }}>
                  Error
                </Text>
                <Text
                  type="small"
                  weight="semibold"
                  color="secondary"
                  className="mb-64 text-center"
                  style={{ fontSize: '12px', fontWeight: '400', color: 'white' }}>
                  An unexpected error occurred. Please try again.
                </Text>
              </div>
            </div>
          ) : (
            <>
              <Icon name="tx-failure" width={180} height={160} className="mb-32 mh-auto" />
              <Text type="h3" weight="semibold" color="primary" className="mb-16 text-center">
                Failed!
              </Text>
              <Text type="small" weight="semibold" color="secondary" className="mb-64 text-center">
                Your transaction failed to execute.
                <br />
                Please try again.
              </Text>
              <Button htmlType="submit" type="primary" onClick={props?.onCancel}>
                Dismiss
              </Button>
            </>
          ))}
      </div>
    </Modal>
  );
};

export default TxStatusModal;
