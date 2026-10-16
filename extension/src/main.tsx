import React from 'react';import {createRoot} from 'react-dom/client';import {ConvexReactClient} from 'convex/react';
import {ExtensionAuthProvider} from '../../src/auth/SharedAuth';import {googlePopup} from './chrome';import {backend} from './client';import {Sidebar} from './Sidebar';
createRoot(document.getElementById('root')!).render(<React.StrictMode><ExtensionAuthProvider client={new ConvexReactClient(backend)} popup={googlePopup}><Sidebar/></ExtensionAuthProvider></React.StrictMode>);
