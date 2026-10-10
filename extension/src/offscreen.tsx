import {createRoot} from 'react-dom/client';import {ConvexReactClient} from 'convex/react';import {ExtensionAuthProvider} from '../../src/auth/SharedAuth';import {CallEngine} from './callEngine';import {backend} from './client';
createRoot(document.getElementById('root')!).render(<ExtensionAuthProvider client={new ConvexReactClient(backend)}><CallEngine/></ExtensionAuthProvider>);
