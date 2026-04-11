// Background task MUST be imported before registerRootComponent so TaskManager
// has the task definition ready before the OS can invoke it.
import './tasks/locationTask';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
