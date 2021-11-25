import React, { Suspense, lazy } from 'react';
import { isMobile } from 'react-device-detect';
import { Redirect, Route, Switch } from 'react-router-dom';
import AntdSpin from 'antd/lib/spin';

import { useWarning } from 'components/providers/warning-provider';

import MetapassProvider from './providers/metapass-provider';

const MintView = lazy(() => import('./views/mint-view'));
const OwnedPasses = lazy(() => import('./views/owned-passes-view'));
const SinglePass = lazy(() => import('./views/single-metapass-view'));

const MetapassView: React.FC = () => {
  const warning = useWarning();

  React.useEffect(() => {
    let warningDestructor: () => void;

    if (isMobile) {
      warningDestructor = warning.addWarn({
        text: 'Transactions can only be made from the desktop version using Metamask',
        closable: true,
        storageIdentity: 'bb_desktop_metamask_tx_warn',
      });
    } else {
      warningDestructor = warning.addWarn({
        text: 'Do not send funds directly to the contract!',
        closable: true,
        storageIdentity: 'bb_send_funds_warn',
      });
    }

    return () => {
      warningDestructor?.();
    };
  }, [isMobile]);

  return (
    <MetapassProvider>
      <Suspense fallback={<AntdSpin />}>
        <Switch>
          <Route path="/sharded-minds" exact component={MintView} />
          <Route path="/sharded-minds/owned" exact component={OwnedPasses} />
          <Route path="/sharded-minds/:tokenId" exact component={SinglePass} />
          <Redirect to="/sharded-minds" />
        </Switch>
      </Suspense>
    </MetapassProvider>
  );
};

export default MetapassView;
