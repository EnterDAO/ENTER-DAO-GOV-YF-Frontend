import React, { FC, useEffect, useState } from 'react';
import { Checkbox, Col, Row, Tabs } from 'antd';

import Alert from 'components/antd/alert';
import Spin from 'components/antd/spin';
import { Text } from 'components/custom/typography';
import { LandWorksToken } from 'components/providers/known-tokens-provider';
import config from 'config';
import { useLandworksYf } from 'modules/yield-farming/providers/landworks-yf-provider';
import { useWallet } from 'wallets/wallet';

import Erc721Contract from '../../../../web3/erc721Contract';
import {
  UserNotStakedAssets,
  UserStakedAssetsWithData,
  fetchAssetsById,
  fetchNotStakedAssets,
  fetchStakedAssets,
  getDecentralandAssetName,
} from '../../api';
import { TABS } from '../../views/landowrks-yf-pool-view';

import './index.scss';

interface ILandWorksPoolProps {
  tab: string;
}
const LandworksPoolStake: FC<ILandWorksPoolProps> = (props: ILandWorksPoolProps) => {
  const { tab } = props;

  const { account } = useWallet();
  const { landworksYf } = useLandworksYf();
  const walletCtx = useWallet();

  const [approved, setApproved] = useState(false);
  const [notStakedAssets, setNotStakedAssets] = useState<UserNotStakedAssets[]>([]);
  const [stakedAssets, setStakedAssets] = useState<UserStakedAssetsWithData[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  // Loaders
  const [stakeBtnLoading, setStakeBtnLoading] = useState(false);
  const [unstakeBtnLoading, setUnstakeBtnLoading] = useState(false);

  // Disablers
  const [stakeBtnDisabled, setStakeBtnDisabled] = useState(false);
  const [unstakeBtnDisabled, setUnstakeBtnDisabled] = useState(false);

  const onLandCheckboxChange = (e: any, id: string) => {
    const checked = e.target.checked;
    const value = Number(id);

    if (checked) {
      const selectedAssetsCopy = [...selectedAssets];
      const updatedCopy = [...selectedAssetsCopy, value];
      setSelectedAssets(updatedCopy);
    } else {
      const selectedAssetsCopy = [...selectedAssets];
      const itemIndex = selectedAssetsCopy.indexOf(value);
      if (itemIndex !== -1) {
        selectedAssetsCopy.splice(itemIndex, 1);
        setSelectedAssets(selectedAssetsCopy);
      }
    }
  };

  const handleStake = async () => {
    try {
      setStakeBtnLoading(true);
      setStakeBtnDisabled(true);
      const stakeTx = await landworksYf.stake(selectedAssets);

      if (stakeTx.status) {
        // Update the local copy cus the Graph will need some time to gets updated, the Refetch of the assets wont help here
        const notStakedAssetsCopy = [...notStakedAssets];
        const updatedCopy = notStakedAssetsCopy.filter(asset => !selectedAssets.includes(Number(asset.id)));
        setNotStakedAssets(updatedCopy);
        setSelectedAssets([]);
      }

      setStakeBtnLoading(false);
      setStakeBtnDisabled(false);
    } catch (e) {
      console.log('Error while trying to stake assets !', e);
    }
  };

  const handleUnstake = async () => {
    try {
      setUnstakeBtnLoading(true);
      setUnstakeBtnDisabled(true);
      const stakeTx = await landworksYf.unstake(selectedAssets);

      if (stakeTx.status) {
        // Update the local copy cus the Graph will need some time to gets updated, the Refetch of the assets wont help here
        const stakedAssetsCopy = [...stakedAssets];
        const updatedCopy = stakedAssetsCopy.filter(asset => !selectedAssets.includes(Number(asset.id)));
        setStakedAssets(updatedCopy);
        setSelectedAssets([]);
      }

      setUnstakeBtnLoading(false);
      setUnstakeBtnDisabled(false);
    } catch (e) {
      console.log('Error while trying to stake assets !', e);
    }
  };

  const handleEnable = async (e: any) => {
    try {
      const tx = await (LandWorksToken.contract as Erc721Contract).setApprovalForAll(
        config.contracts.yf.landworks || '',
        true,
      );

      if (tx.status) {
        setApproved(tx.status);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getNotStakedAssets = async () => {
    try {
      const data = await fetchNotStakedAssets(account || '');
      if (data.assets.length) {
        setNotStakedAssets(data.assets);
      }
    } catch (e) {
      console.log('Error while trying to fetch not staked user assets !', e);
    }
  };

  const getStakedAssets = async () => {
    try {
      const assets = await fetchStakedAssets(account || '');
      const assetData = await fetchAssetsById(assets.map(a => a.tokenId));
      setStakedAssets(assetData);
    } catch (e) {
      console.log('Error while trying to fetch staked user assets !', e);
    }
  };

  useEffect(() => {
    if (account) {
      getNotStakedAssets();
      getStakedAssets();
    }
  }, [account, tab]);

  useEffect(() => {
    const hasApproved = async () => {
      try {
        const approved = await (LandWorksToken.contract as Erc721Contract).isApprovedForAll(
          account || '',
          config.contracts.yf.landworks,
        );

        setApproved(approved);
      } catch (err) {
        console.log(err);
      }
    };

    if (account) {
      hasApproved();
    }
  }, [account]);

  useEffect(() => {
    const stakeDisabled = !selectedAssets.length;
    setStakeBtnDisabled(stakeDisabled);
    setUnstakeBtnDisabled(stakeDisabled);
  }, [selectedAssets.length]);

  if (!walletCtx.isActive) {
    return (
      <section className="landworks-pool-stake">
        <Alert className="mb-32" message="Please sign-in in order to stake your LandWorks NFTs." />;
      </section>
    );
  }

  const assets = tab === TABS.STAKE ? notStakedAssets : stakedAssets;

  return (
    <section className="landworks-pool-stake">
      <Row justify="center">
        <Col>
          {(() => {
            if (tab === TABS.UNSTAKE && assets.length === 0) {
              return <Alert className="mb-32" message="You don't have any LandWorks NFTs staked." />;
            }
            if (tab === TABS.STAKE && assets.length === 0) {
              return <Alert className="mb-32" message="You don't have any LandWorks NFTs to stake." />;
            }
            return <p className="headMsg">Select the land you want to stake/unstake from the list</p>;
          })()}
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="lands-container">
        {assets.map(asset => {
          const name = getDecentralandAssetName(asset.decentralandData);
          return (
            <Col xs={24} sm={24} md={12} lg={12} xl={12} key={asset.id}>
              <div className="landBox">
                <Checkbox className="landCheckbox" onChange={e => onLandCheckboxChange(e, asset.id)} />
                <span>{name}</span>
              </div>
            </Col>
          );
        })}
      </Row>
      <Row className="buttons-container" gutter={[16, 16]}>
        {tab === TABS.STAKE ? (
          <>
            <Col>
              <button type="button" className="button-primary" disabled={stakeBtnDisabled} onClick={handleStake}>
                {stakeBtnLoading && <Spin spinning />}
                Stake
              </button>
            </Col>

            <Col>
              <button type="button" className="button-primary" disabled={approved} onClick={handleEnable}>
                {false && <Spin spinning />}
                Enable LandWorks NFTs
              </button>
            </Col>
          </>
        ) : (
          <Col>
            <button type="button" className="button-primary" disabled={unstakeBtnDisabled} onClick={handleUnstake}>
              {unstakeBtnLoading && <Spin spinning />}
              Unstake
            </button>
          </Col>
        )}
      </Row>
    </section>
  );
};

export default LandworksPoolStake;
