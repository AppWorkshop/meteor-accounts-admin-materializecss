Package.describe({
  summary: "Comprehensive user management for materializecss. Forked from mrt:accounts-admin-ui-bootstrap-3.",
  git: 'https://github.com/AppWorkshop/meteor-accounts-admin-materializecss',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
  version: "0.5.1",
  name: "cunneen:accounts-admin-materializecss"
});

Package.on_use(function (api, where) {
  api.versionsFrom("1.5");
  api.use([
      "ecmascript",
      "alanning:roles@1.2.8",
      'coffeescript@1.0.17',
      'templating@1.1.14',
      'check',
      'underscore',
      'logging',
      'aslagle:reactive-table@0.8.44',
      'softwarerero:accounts-t9n@1.1.4'],
    ['client',
      'server']);
  api.use([
    'gfk:underscore-deep@1.0.0',
    'session'
  ], ['client']);

  api.addFiles(['libs/t9n/en.coffee', 'libs/t9n/id.coffee'], 'client');
  api.addFiles('libs/role_hierarchy.js', ['client', 'server']);
  api.addFiles('libs/user_query.js', ['client', 'server']);
  api.addFiles([
    'client/helperFunctions.js',
    'client/roles_hierarchy_helpers.js',
    'client/addUser.html',
    'client/addUser.js',
    'client/resetPassword.html',
    'client/resetPassword.js',
    'client/accounts_admin.html',
    'client/accounts_admin.js',
    'client/delete_account_modal.html',
    'client/delete_account_modal.js',
    'client/info_account_modal.html',
    'client/info_account_modal.js',
    'client/update_account_modal.html',
    'client/update_account_modal.js',
    'client/update_roles_modal.html',
    'client/update_roles_modal.js',
    'style/style.css',
  ], 'client');
  api.addFiles(['server/startup.js',
    'server/publish.js',
    'server/methods.js'
  ], 'server');
  api.export('RolesTree', ['client', 'server']);
  api.export('RolesHierarchy', ['client', 'server']);
});
