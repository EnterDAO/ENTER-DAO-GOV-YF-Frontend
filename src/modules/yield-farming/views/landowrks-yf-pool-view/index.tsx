import React, { FC, useEffect, useState } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';
import cn from 'classnames';

import Spin from 'components/antd/spin';
import { Tabs } from 'components/custom/tabs';

import LandworksPoolHeader from '../../components/landworks-pool-header';
import PoolStake from '../../components/pool-stake';
import PoolStatistics from '../../components/pool-statistics';
import PoolTransactions from '../../components/pool-transactions';
import PoolUnstake from '../../components/pool-unstake';
import LandowrksYfProvider, { useLandworksYf } from '../../providers/landworks-yf-provider';
import { YFPoolID } from '../../providers/pools-provider';

import s from './s.module.scss';

const LandowrksYfPoolViewInner: FC = () => {
  const yfPoolCtx = useLandworksYf();

  const { landworksYf } = yfPoolCtx;

  const [activeTab, setActiveTab] = useState('stake');

  useEffect(() => {
    document.documentElement.scrollTop = 0;
  }, []);

  // useEffect(() => {
  //   if (poolMeta?.contract.isPoolEnded === true) {
  //     setActiveTab('unstake');
  //   }
  // }, [poolMeta?.contract.isPoolEnded]);

  // if (!poolMeta || !poolMeta.contract.isPoolAvailable) {
  //   return <Redirect to="/yield-farming" />;
  // }

  // const isInitialized = poolMeta.contract.isPoolEnded !== undefined;
  const isInitialized = true;

  return (
    <div className="content-container-fix content-container">
      <LandworksPoolHeader />
      <Spin spinning={!isInitialized} wrapperClassName="mb-32">
        <div className="flexbox-grid">
          <div className={cn('card', s.stakeCard)}>
            <div className={cn('card-header pv-0', s.stakeCardHeader)}>
              <Tabs
                tabs={[
                  {
                    id: 'stake',
                    children: 'Stake',
                    //disabled: poolMeta.contract.isPoolEnded !== false,
                    disabled: false,
                  },
                  {
                    id: 'unstake',
                    children: 'Unstake',
                  },
                ]}
                size="small"
                activeKey={activeTab}
                onClick={setActiveTab}
              />
            </div>
            <div className="p-24">
              {activeTab === 'stake' && <PoolStake />}
              {activeTab === 'unstake' && <PoolUnstake />}
            </div>
          </div>
          <PoolStatistics />
        </div>
      </Spin>
      <PoolTransactions />
    </div>
  );
};

// type RouteParams = {
//   poolId: YFPoolID;
// };

const LandowrksYfPoolView: FC = () => {
  // const match = useRouteMatch<RouteParams>();
  // const { poolId } = match.params;

  return (
    <LandowrksYfProvider>
      <LandowrksYfPoolViewInner />
    </LandowrksYfProvider>
  );
};

export default LandowrksYfPoolView;
