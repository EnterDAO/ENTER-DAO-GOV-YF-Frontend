import { FC, useEffect, useMemo, useState } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useWeb3React } from '@web3-react/core';
import { BigNumber as _BigNumber } from 'bignumber.js';
import cn from 'classnames';
import { BigNumber } from 'ethers';
import { shortenAddr } from 'web3/utils';
import Web3Contract from 'web3/web3Contract';

import Spin from 'components/antd/spin';
import ExternalLink from 'components/custom/externalLink';
import Grid from 'components/custom/grid';
import Icon from 'components/custom/icon';
import { Text } from 'components/custom/typography';
import { Hint } from 'components/custom/typography';
import { EnterToken, EthToken } from 'components/providers/known-tokens-provider';
import config from 'config';
import BalanceTree from 'merkle-distributor/balance-redeem-tree';
import FAQs from 'modules/redeem/components/FAQs';
import RedeemWithApproveModal from 'modules/redeem/components/RedeemWithApproveModal';
import RedeemWithPermitModal from 'modules/redeem/components/ReedemWithPermitModal';
import { useRedeem } from 'modules/redeem/providers/redeem-provider';
import warning from 'resources/svg/warning.svg';
import { useWallet } from 'wallets/wallet';

import tokenAbi from '../../../../ABI/ENTR_TOKEN_ABI.json';
import redeemData from '../../../../merkle-distributor/redeem-tree.json';
import graphic1Img from '../../animations/graphic1.svg';
import graphic2Img from '../../animations/graphic2.svg';
import AlreadyRedeemed, { boldWhiteStyle, whiteStyle } from '../../components/AlreadyRedeemed';
import NotConnectWallet from '../../components/NotConnectWallet';
import NotEligible from '../../components/NotEligible';
import TextAndImage from '../../components/TextAndImage';

import s from './redeem.module.scss';

export const formatBigNumber = (number: _BigNumber, decimalPlaces = 4) => {
  const threshold = new _BigNumber(1).div(new _BigNumber(10).pow(decimalPlaces));

  if (number.absoluteValue().lt(threshold)) {
    return `0.${'0'.repeat(decimalPlaces)}`;
  }

  if (number.isZero()) return `0.${'0'.repeat(decimalPlaces)}`;

  return parseFloat(number.toFixed(decimalPlaces)).toString();
};

const Redeem: FC = () => {
  const redeemCtx = useRedeem();
  const walletCtx = useWallet();
  const [tokenBalance, setTokenBalance] = useState<_BigNumber>(new _BigNumber(0));
  const { account, library } = useWeb3React();
  const erc20TokenContract = useMemo(() => {
    if (library) {
      return new Contract(config.tokens.entr, tokenAbi, library.getSigner());
    }
  }, [library, config.tokens.entr, tokenAbi]);

  const [isMultiSigWallet, setIsMultiSigWallet] = useState(false);
  const [tokenApproved, setTokenApproved] = useState<_BigNumber>(new _BigNumber(0));
  const [redeemWithPermitModalVisible, showRedeemWithPermitModal] = useState(false);
  const [redeemWithApproveModalVisible, showRedeemWithApproveModal] = useState(false);
  const merkleDistributorContract = redeemCtx.merkleDistributor;

  const wallet = useWallet();

  const redeemAmountETH = merkleDistributorContract?.allocatedEth || 0;
  const redeemAmountENTR = merkleDistributorContract?.allocatedTokens || 0;
  const redeemIndex = merkleDistributorContract?.redeemIndex ?? -1;

  const tree = useMemo(() => {
    if (walletCtx.account) {
      const redeemAccounts = Object.entries(redeemData.redemptions).map(([address, data]) => ({
        account: address,
        tokens: BigNumber.from((data as any).tokens),
        eth: BigNumber.from((data as any).eth),
      }));

      return new BalanceTree(redeemAccounts);
    }
  }, [walletCtx]);

  const merkleProof =
    redeemIndex !== -1
      ? tree?.getProof(
          +redeemIndex,
          walletCtx.account || '',
          BigNumber.from(redeemAmountENTR),
          BigNumber.from(redeemAmountETH),
        )
      : [];

  useEffect(() => {
    if (account && library && erc20TokenContract && walletCtx.account) {
      const fetchERC20DataOfAccount = async () => {
        const balance = await erc20TokenContract?.balanceOf(account);
        const allowance = await erc20TokenContract.allowance(account, merkleDistributorContract?.address);
        const isMultiSig = await Web3Contract.isContract(account);

        setIsMultiSigWallet(isMultiSig);
        setTokenBalance(new _BigNumber(balance.toString()));
        setTokenApproved(new _BigNumber(allowance.toString()));
      };
      merkleDistributorContract?.loadCommonFor(walletCtx.account).catch(Error);

      fetchERC20DataOfAccount().catch(console.error);
    }
  }, [
    account,
    library,
    config.tokens.entr,
    tokenAbi,
    merkleDistributorContract,
    erc20TokenContract,
    walletCtx.account,
  ]);

  const userData = {
    index: redeemIndex,
    account: walletCtx.account,
    tokens: redeemAmountENTR,
    eth: redeemAmountETH,
    merkleProof: merkleProof,
    actualBalance: tokenBalance.toFixed(),
    library: library,
    erc20: erc20TokenContract,
  };
  merkleDistributorContract!.loadUserData(userData);

  const isAlreadyApproved = tokenApproved.gte(new _BigNumber(redeemAmountENTR));
  const lockedRedeem =
    merkleDistributorContract?.redeemIndex === -1 || merkleDistributorContract?.redeemIndex === undefined;

  const allocatedEth = new _BigNumber(merkleDistributorContract?.allocatedEth ?? 0).unscaleBy(EthToken.decimals);
  const allocatedTokens = new _BigNumber(merkleDistributorContract?.allocatedTokens ?? 0);
  const redeemedAmountETH = new _BigNumber(merkleDistributorContract?.redeemedAmountETH ?? 0).unscaleBy(
    EthToken.decimals,
  );
  const redeemedAmountTokens = new _BigNumber(merkleDistributorContract?.redeemedAmountTokens ?? 0).unscaleBy(
    EnterToken.decimals,
  );
  const txHash = merkleDistributorContract?.txHash ?? '';
  const redeemableAmountTokens = new _BigNumber(merkleDistributorContract?.redeemableAmountTokens ?? 0).unscaleBy(
    EnterToken.decimals,
  );
  const redeemableAmountETH = new _BigNumber(merkleDistributorContract?.redeemableAmountETH ?? 0).unscaleBy(
    EthToken.decimals,
  );

  if (!merkleDistributorContract?.isInitialized && wallet.isActive) {
    return <Spin />;
  }

  const handleRedeem = () => {
    showRedeemWithPermitModal(true);
  };

  const handleRedeemWithApprove = () => {
    showRedeemWithApproveModal(true);
  };

  return (
    <section className={s.page}>
      <Grid colsTemplate={'1fr 1fr'} className={cn(s.grid__container, s.card__big)}>
        <div className={s.general__info}>
          <span style={{ fontWeight: '300' }}>REDEEM </span>
          <span>ETH</span>
          <br />
          <span style={{ fontWeight: '300' }}>FOR </span>
          <span>ENTR</span>
          <Text
            type="p1"
            color="secondary"
            className="mb-32"
            style={{ width: '480px', color: 'white', marginTop: '32px' }}>
            Use the ENTR Redemption Portal to redeem your ETH for ENTR. You can redeem your ETH at a fixed rate of
            0.00001133 ETH per 1 ENTR until February 21st 2025 at 23h59 UTC.
          </Text>
          <ExternalLink
            type="button"
            className="button-ghost"
            style={{ height: '44px', width: '215px', fontSize: '16px' }}
            href="https://medium.com/enterdao/a-next-step-for-enterdao-2b8714bc0122">
            <span
              style={{ fontSize: '16px', fontWeight: '500', fontFamily: 'Poppins, sans-serif', textTransform: 'none' }}>
              Read Medium Article
            </span>
          </ExternalLink>
        </div>
        <Grid
          colsTemplate="1fr 1fr"
          rowsTemplate="auto auto"
          gap={16}
          justify="space-between"
          className={cn(s.card, s.card__head, 'mb-32')}>
          <div className={s.info__vl}>
            <div>
              <Hint text="The amount of ETH you have already redeemed." className="mb-8">
                <Text type="p2" color="secondary" style={{ textTransform: 'none', fontSize: '12px' }}>
                  Total Redeemed
                </Text>
              </Hint>
              <div className="flex flow-col align-center justify-center mr-8">
                <Icon width={30} height={30} name="png/eth" className="mr-6" />
                <Text type="h3" weight="bold" color="primary" style={{ lineHeight: '18px' }}>
                  {!wallet.isActive || lockedRedeem ? (
                    '--'
                  ) : merkleDistributorContract?.isRedeemClaimed === undefined ? (
                    <Spin />
                  ) : merkleDistributorContract?.isRedeemClaimed ? (
                    formatBigNumber(redeemedAmountETH!)
                  ) : (
                    '0.000'
                  )}
                </Text>
                &nbsp;
                <Text type="h3" style={{ color: '#fff', lineHeight: '18px' }}>
                  ETH
                </Text>
              </div>
            </div>
          </div>
          <div className={cn(s.info__vl, s.info__vl__last)}>
            <div>
              <Hint text="The amount of ETH you are eligible for." className="mb-8">
                <Text type="p2" color="secondary" style={{ textTransform: 'none', color: '#25225E', fontSize: '12px' }}>
                  Eligible For
                </Text>
              </Hint>
              <div className="flex flow-col align-center align-center mr-8">
                <Icon width={30} height={30} name="png/eth" className="mr-6" />
                <Text type="h3" weight="bold" color="green">
                  {!wallet.isActive || lockedRedeem ? (
                    '--'
                  ) : merkleDistributorContract?.isRedeemClaimed === undefined ? (
                    <Spin />
                  ) : merkleDistributorContract?.isRedeemClaimed ? (
                    '0.0000'
                  ) : (
                    formatBigNumber(allocatedEth!)
                  )}
                </Text>
                &nbsp;
                <Text type="h3" color="green">
                  ETH
                </Text>
              </div>
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            {!wallet.isActive ? (
              <div className={s.card__empty}>
                <NotConnectWallet />
              </div>
            ) : lockedRedeem ? (
              <div className={s.card__empty}>
                <NotEligible />
              </div>
            ) : merkleDistributorContract?.isRedeemClaimed === undefined ? (
              <div className={s.card__empty}>
                <Spin />
              </div>
            ) : merkleDistributorContract?.isRedeemClaimed ? (
              <div className={s.card__empty}>
                <AlreadyRedeemed
                  entrAmount={formatBigNumber(redeemedAmountTokens!)}
                  ethAmount={formatBigNumber(redeemedAmountETH!)}
                  txHash={txHash}
                />
              </div>
            ) : (
              <div className={s.redeem__info__details}>
                <div className={s.redeem__container}>
                  <Text type="h1">
                    <span style={{ ...boldWhiteStyle, fontSize: '16px', lineHeight: '24px' }}>{`${shortenAddr(
                      wallet.account,
                      5,
                      3,
                    )}`}</span>
                    <span style={{ ...whiteStyle, fontSize: '16px', lineHeight: '24px' }}> is eligible for</span>
                  </Text>
                  <div className="flex flow-col align-center align-center justify-center">
                    <span style={{ fontSize: '64px', lineHeight: '64px', fontWeight: '700' }}>
                      {!wallet.isActive || lockedRedeem ? (
                        '--'
                      ) : merkleDistributorContract?.isRedeemClaimed === undefined ? (
                        <Spin />
                      ) : merkleDistributorContract?.isRedeemClaimed ? (
                        '0.0000'
                      ) : (
                        formatBigNumber(allocatedEth!)
                      )}
                    </span>
                    &nbsp;
                    <span style={{ fontSize: '48px', lineHeight: '48px ', height: '37px', fontWeight: '300' }}>
                      ETH
                    </span>
                  </div>
                  <Text
                    type="p1"
                    weight="500"
                    color="secondary"
                    align="center"
                    style={{
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '400',
                      lineHeight: '24px',
                      marginTop: '20px',
                    }}>
                    You must burn
                    <span style={{ fontWeight: '700' }}>
                      {' '}
                      {formatBigNumber(new _BigNumber(userData.tokens.toString()).unscaleBy(EnterToken.decimals)!)}
                    </span>{' '}
                    ENTR to redeem
                    <span style={{ fontWeight: '700' }}> {formatBigNumber(allocatedEth!)} </span> ETH
                    <br />
                    Your wallet's ENTR balance is:{' '}
                    <span style={{ fontWeight: '700' }}>
                      {' '}
                      {formatBigNumber(tokenBalance.unscaleBy(EnterToken.decimals)!)}
                    </span>{' '}
                    ENTR
                  </Text>
                </div>
                <div className={s.redeem__button_container}>
                  {isMultiSigWallet ? (
                    <button className={cn('button-primary', s.redeem__button)} onClick={handleRedeemWithApprove}>
                      {isAlreadyApproved
                        ? `Burn ${formatBigNumber(redeemableAmountTokens!)} ENTR to redeem ${formatBigNumber(
                            redeemableAmountETH!,
                          )} ETH`
                        : 'Approve and Redeem'}
                    </button>
                  ) : (
                    <button className={cn('button-primary', s.redeem__button)} onClick={handleRedeem}>
                      Burn {formatBigNumber(redeemableAmountTokens!)} ENTR to redeem{' '}
                      {formatBigNumber(redeemableAmountETH!)} ETH
                    </button>
                  )}

                  <div className={s.warning__container}>
                    <div style={{ marginTop: '-3px' }}>
                      <img src={warning} alt="" style={{ marginRight: '10px' }} />
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '18px' }}>
                      <span style={{ textTransform: 'revert' }}>
                        <b>Pay Attention</b>
                      </span>{' '}
                      <br />
                      <span style={{ color: '#B9B9D3', textTransform: 'revert' }}>
                        You can redeem your tokens only once.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Grid>
      </Grid>
      <div className={s.container}>
        <TextAndImage image={graphic1Img} imageFirst>
          <div className={s.flex__column}>
            <Text type="h1" style={{ alignSelf: 'flex-start', textTransform: 'uppercase', marginBottom: '32px' }}>
              How it works
            </Text>
            <Text type="h3">
              {' '}
              <b className="mr-8">Step 1</b> Connect your wallet
            </Text>
            <Text type="h3">
              {' '}
              <b className="mr-8">Step 2</b> Ensure you have the ENTR tokens you are eligible for in your wallet
            </Text>
            <Text type="h3">
              {' '}
              <b className="mr-8">Step 3</b> Complete the transaction
            </Text>
          </div>
        </TextAndImage>
        <TextAndImage image={graphic2Img}>
          <div className={s.flex__column}>
            <Text type="h1" style={{ alignSelf: 'flex-start', textTransform: 'uppercase', marginBottom: '32px' }}>
              WHO IS ELIGIBLE
            </Text>
            <Text type="h3">
              All addresses holding ENTR tokens on February 06, 2024 are eligible to redeem. The snapshot includes:
              <ol>
                <li>ENTR balance in wallet</li>
                <li> tokens staked in the DAO</li>
                <li>tokens in liquidity pools</li>
                <li>tokens from LW rewards</li>
                <li>vesting contracts</li>
              </ol>
              There is an additional boost for Sharded Minds NFT holders - a boost of 5% for 1 to 10 NFTs in the same
              wallet, boost of 10% for 11 to 20 NFTs and a boost of 15% for more than 20 NFTs in the same wallet.
            </Text>
          </div>
        </TextAndImage>
      </div>
      <FAQs />
      {redeemWithPermitModalVisible && (
        <RedeemWithPermitModal
          userData={userData}
          merkleDistributor={merkleDistributorContract}
          redeemableAmountETH={redeemableAmountETH && formatBigNumber(redeemableAmountETH!)}
          redeemableAmountTokens={redeemableAmountTokens && formatBigNumber(redeemableAmountTokens!)}
          allocatedEth={formatBigNumber(allocatedEth!)}
          onCancel={() => showRedeemWithPermitModal(false)}
          className="redeem__modal"
        />
      )}

      {redeemWithApproveModalVisible && (
        <RedeemWithApproveModal
          userData={userData}
          merkleDistributor={merkleDistributorContract}
          redeemableAmountETH={redeemableAmountETH && formatBigNumber(redeemableAmountETH!)}
          redeemableAmountTokens={redeemableAmountTokens && formatBigNumber(redeemableAmountTokens!)}
          onCancel={() => showRedeemWithApproveModal(false)}
          className="redeem__modal"
        />
      )}
    </section>
  );
};

export default Redeem;
