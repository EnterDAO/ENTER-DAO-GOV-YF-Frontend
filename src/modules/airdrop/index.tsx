import React, { Suspense, lazy } from 'react';
import { isMobile } from 'react-device-detect';
import { Redirect, Route, Switch } from 'react-router-dom';
import AntdSpin from 'antd/lib/spin';

import { useWarning } from 'components/providers/warning-provider';

import AirdropProvider from './providers/airdrop-provider';

const AirdropView = lazy(() => import('./views/airdrop-page'));

const AirdropPageView: React.FC = () => {
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
    <AirdropProvider>
      <Suspense fallback={<AntdSpin />}>
        <Switch>
          <Route path="/airdrop" exact component={AirdropView} />
          <Redirect to="/airdrop" />
        </Switch>
      </Suspense>
    </AirdropProvider>
  );
};

export default AirdropPageView;
