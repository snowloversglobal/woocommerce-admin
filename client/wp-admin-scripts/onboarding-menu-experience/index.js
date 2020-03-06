/**
 * External dependencies
 */
import { render, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { get, filter } from 'lodash';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import withSelect from 'wc-api/with-select';
import { getAllTasks } from '../../dashboard/task-list/tasks';
import { isOnboardingEnabled } from 'dashboard/utils';

function hideOrShowMenuItemsForTaskList( show ) {
	const topLevelPageWooCommerceLi = document.getElementById(
		'toplevel_page_woocommerce'
	);
	const allSubmenuItems = [
		...topLevelPageWooCommerceLi.children[ 1 ].children,
	];
	const submenuItemsToHide = allSubmenuItems.filter(
		( x ) =>
			! x.classList.contains( 'wp-submenu-head' ) &&
			! x.classList.contains( 'wp-first-item' )
	);

	submenuItemsToHide.forEach( ( x ) => {
		x.hidden = ! show;
	} );

	const dashboardLi = allSubmenuItems.filter( ( x ) =>
		x.classList.contains( 'wp-first-item' )
	)[ 0 ];

	dashboardLi.children[ 0 ].innerHTML = show
		? __( 'Dashboard' )
		: __( 'Setup' );
}

// This is an empty component that is created just to get access to withSelect
// and the wc-api. Stuff is done with the retrieved data in the component
// - which just returns an empty fragment.
const WrappedComponent = compose(
	withSelect( ( select, props ) => {
		if ( ! isOnboardingEnabled() && ! wcSettings.onboarding ) {
			return {
				showMenu: true,
			};
		}

		const {
			getOptions,
			isGetOptionsRequesting,
			getProfileItems,
			isGetProfileItemsRequesting,
		} = select( 'wc-api' );
		const optionNames = [
			'woocommerce_task_list_skip_store_setup',
			'woocommerce_task_list_do_this_later',
			'woocommerce_task_list_hidden',
		];
		const options = getOptions( optionNames );
		const optionsRequesting = isGetOptionsRequesting( optionNames );
		const skipStoreSetup = get(
			options,
			[ 'woocommerce_task_list_skip_store_setup' ],
			false
		);
		const doThisLater = get(
			options,
			[ 'woocommerce_task_list_do_this_later' ],
			false
		);
		const taskListHidden =
			get( options, [ 'woocommerce_task_list_hidden' ], 'no' ) === 'yes';
		const profileItems = getProfileItems();
		const profileItemsRequesting = isGetProfileItemsRequesting();
		const tasks = getAllTasks( {
			profileItems,
			options: getOptions( [ 'woocommerce_task_list_payments' ] ),
			query: props.query,
		} );
		const visibleTasks = filter( tasks, ( x ) => x.visible );
		const completedTasks = filter(
			tasks,
			( x ) => x.visible && x.completed
		);
		const taskListCompleted = visibleTasks.length === completedTasks.length;

		return {
			showMenu:
				taskListHidden ||
				taskListCompleted ||
				skipStoreSetup ||
				doThisLater ||
				optionsRequesting ||
				profileItemsRequesting,
		};
	} )
)( ( { showMenu } ) => {
	hideOrShowMenuItemsForTaskList( showMenu );

	return <Fragment></Fragment>;
} );

// Render the wrapped component in a new div appended to the document body
render(
	<WrappedComponent />,
	document.body.appendChild( document.createElement( 'div' ) )
);
