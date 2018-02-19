Package.describe({
	summary: "Comprehensive user management for materializecss. Forked from mrt:accounts-admin-ui-bootstrap-3.",
  git: 'https://github.com/AppWorkshop/meteor-accounts-admin-materializecss',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
  version: "0.3.3",
  name: "cunneen:accounts-admin-materializecss"
});

Package.on_use(function (api, where) {
  api.versionsFrom("1.3");
	api.use([
			"ecmascript",
			"alanning:roles@1.2.8",
			'coffeescript',
			'templating',
			'check',
			'underscore',
			'logging',
			'softwarerero:accounts-t9n@1.1.4'],
		['client',
			'server']);
	api.use(['session'],['client']);

  var path = Npm.require('path');
  api.add_files(path.join('libs','t9n','en.coffee'), 'client');
  api.add_files(path.join('libs','t9n','id.coffee'), 'client');
  api.add_files('libs/role_hierarchy.js', ['client', 'server']);
	api.add_files('libs/user_query.js', ['client', 'server']);

  api.add_files('client/roles_hierarchy_helpers.js', 'client');
	api.add_files('client/accounts_admin.html', 'client');
	api.add_files('client/accounts_admin.js', 'client');
	api.add_files('client/delete_account_modal.html', 'client');
	api.add_files('client/delete_account_modal.js', 'client');
	api.add_files('client/info_account_modal.html', 'client');
	api.add_files('client/info_account_modal.js', 'client');
	api.add_files('client/update_account_modal.html', 'client');
	api.add_files('client/update_account_modal.js', 'client');
	api.add_files('client/update_roles_modal.html', 'client');
	api.add_files('client/update_roles_modal.js', 'client');

	api.add_files('style/style.css', 'client');

	api.add_files('server/startup.js', 'server');
	api.add_files('server/publish.js', 'server');
	api.add_files('server/methods.js', 'server');
  api.export('RolesTree', ['client', 'server']);
  api.export('RolesHierarchy',['client','server']);
});
