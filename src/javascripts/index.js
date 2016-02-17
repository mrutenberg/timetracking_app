import TimeTrackingApp from './app';
import MigrationHelper from './migration_helper';

var client = window.ZAFClient.init();
var app = new MigrationHelper(client, TimeTrackingApp);
