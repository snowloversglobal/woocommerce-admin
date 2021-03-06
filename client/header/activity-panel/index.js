/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import clickOutside from 'react-click-outside';
import { Component } from '@wordpress/element';
import Gridicon from 'gridicons';
import { IconButton, NavigableMenu } from '@wordpress/components';
import { partial, uniqueId, find } from 'lodash';
import { getSetting } from '@woocommerce/wc-admin-settings';

/**
 * Internal dependencies
 */
import './style.scss';
import ActivityPanelToggleBubble from './toggle-bubble';
import { H, Section } from '@woocommerce/components';
import {
	getUnreadNotes,
	getUnreadOrders,
	getUnapprovedReviews,
	getUnreadStock,
} from './unread-indicators';
import InboxPanel from './panels/inbox';
import OrdersPanel from './panels/orders';
import StockPanel from './panels/stock';
import { recordEvent } from 'lib/tracks';
import ReviewsPanel from './panels/reviews';
import withSelect from 'wc-api/with-select';

const manageStock = getSetting( 'manageStock', 'no' );
const reviewsEnabled = getSetting( 'reviewsEnabled', 'no' );

class ActivityPanel extends Component {
	constructor() {
		super( ...arguments );
		this.togglePanel = this.togglePanel.bind( this );
		this.clearPanel = this.clearPanel.bind( this );
		this.toggleMobile = this.toggleMobile.bind( this );
		this.renderTab = this.renderTab.bind( this );
		this.state = {
			isPanelOpen: false,
			mobileOpen: false,
			currentTab: '',
			isPanelSwitching: false,
		};
	}

	togglePanel( tabName ) {
		const { isPanelOpen, currentTab } = this.state;

		// If a panel is being opened, or if an existing panel is already open and a different one is being opened, record a track.
		if ( ! isPanelOpen || tabName !== currentTab ) {
			recordEvent( 'activity_panel_open', { tab: tabName } );
		}

		this.setState( ( state ) => {
			if ( tabName === state.currentTab || state.currentTab === '' ) {
				return {
					isPanelOpen: ! state.isPanelOpen,
					currentTab: tabName,
					mobileOpen: ! state.isPanelOpen,
				};
			}
			return { currentTab: tabName, isPanelSwitching: true };
		} );
	}

	clearPanel() {
		this.setState( ( { isPanelOpen } ) =>
			isPanelOpen ? { isPanelSwitching: false } : { currentTab: '' }
		);
	}

	// On smaller screen, the panel buttons are hidden behind a toggle.
	toggleMobile() {
		const tabs = this.getTabs();
		this.setState( ( state ) => ( {
			mobileOpen: ! state.mobileOpen,
			currentTab: state.mobileOpen ? '' : tabs[ 0 ].name,
			isPanelOpen: ! state.mobileOpen,
		} ) );
	}

	handleClickOutside() {
		const { isPanelOpen, currentTab } = this.state;

		if ( isPanelOpen ) {
			this.togglePanel( currentTab );
		}
	}

	// @todo Pull in dynamic unread status/count
	getTabs() {
		const {
			hasUnreadNotes,
			hasUnreadOrders,
			hasUnapprovedReviews,
			hasUnreadStock,
		} = this.props;
		return [
			{
				name: 'inbox',
				title: __( 'Inbox', 'woocommerce-admin' ),
				icon: <Gridicon icon="mail" />,
				unread: hasUnreadNotes,
			},
			{
				name: 'orders',
				title: __( 'Orders', 'woocommerce-admin' ),
				icon: <Gridicon icon="pages" />,
				unread: hasUnreadOrders,
			},
			manageStock === 'yes'
				? {
						name: 'stock',
						title: __( 'Stock', 'woocommerce-admin' ),
						icon: <Gridicon icon="clipboard" />,
						unread: hasUnreadStock,
				  }
				: null,
			reviewsEnabled === 'yes'
				? {
						name: 'reviews',
						title: __( 'Reviews', 'woocommerce-admin' ),
						icon: <Gridicon icon="star" />,
						unread: hasUnapprovedReviews,
				  }
				: null,
		].filter( Boolean );
	}

	getPanelContent( tab ) {
		switch ( tab ) {
			case 'inbox':
				return <InboxPanel />;
			case 'orders':
				const { hasUnreadOrders } = this.props;
				return <OrdersPanel hasActionableOrders={ hasUnreadOrders } />;
			case 'stock':
				return <StockPanel />;
			case 'reviews':
				const { hasUnapprovedReviews } = this.props;
				return (
					<ReviewsPanel
						hasUnapprovedReviews={ hasUnapprovedReviews }
					/>
				);
			default:
				return null;
		}
	}

	renderPanel() {
		const { isPanelOpen, currentTab, isPanelSwitching } = this.state;

		const tab = find( this.getTabs(), { name: currentTab } );
		if ( ! tab ) {
			return (
				<div className="woocommerce-layout__activity-panel-wrapper" />
			);
		}

		const classNames = classnames(
			'woocommerce-layout__activity-panel-wrapper',
			{
				'is-open': isPanelOpen,
				'is-switching': isPanelSwitching,
			}
		);

		return (
			<div
				className={ classNames }
				tabIndex={ 0 }
				role="tabpanel"
				aria-label={ tab.title }
				onTransitionEnd={ this.clearPanel }
				onAnimationEnd={ this.clearPanel }
			>
				<div
					className="woocommerce-layout__activity-panel-content"
					key={ 'activity-panel-' + currentTab }
					id={ 'activity-panel-' + currentTab }
				>
					{ this.getPanelContent( currentTab ) }
				</div>
			</div>
		);
	}

	renderTab( tab, i ) {
		const { currentTab, isPanelOpen } = this.state;
		const className = classnames(
			'woocommerce-layout__activity-panel-tab',
			{
				'is-active': isPanelOpen && tab.name === currentTab,
				'has-unread': tab.unread,
			}
		);

		const selected = tab.name === currentTab;
		let tabIndex = -1;

		// Only make this item tabbable if it is the currently selected item, or the panel is closed and the item is the first item.
		if ( selected || ( ! isPanelOpen && i === 0 ) ) {
			tabIndex = null;
		}

		return (
			<IconButton
				role="tab"
				className={ className }
				tabIndex={ tabIndex }
				aria-selected={ selected }
				aria-controls={ 'activity-panel-' + tab.name }
				key={ 'activity-panel-tab-' + tab.name }
				id={ 'activity-panel-tab-' + tab.name }
				onClick={ partial( this.togglePanel, tab.name ) }
				icon={ tab.icon }
			>
				{ tab.title }{ ' ' }
				{ tab.unread && (
					<span className="screen-reader-text">
						{ __( 'unread activity', 'woocommerce-admin' ) }
					</span>
				) }
			</IconButton>
		);
	}

	render() {
		const tabs = this.getTabs();
		const { mobileOpen } = this.state;
		const headerId = uniqueId( 'activity-panel-header_' );
		const panelClasses = classnames( 'woocommerce-layout__activity-panel', {
			'is-mobile-open': this.state.mobileOpen,
		} );

		const hasUnread = tabs.some( ( tab ) => tab.unread );
		const viewLabel = hasUnread
			? __(
					'View Activity Panel, you have unread activity',
					'woocommerce-admin'
			  )
			: __( 'View Activity Panel', 'woocommerce-admin' );

		return (
			<div>
				<H id={ headerId } className="screen-reader-text">
					{ __( 'Store Activity', 'woocommerce-admin' ) }
				</H>
				<Section
					component="aside"
					id="woocommerce-activity-panel"
					aria-labelledby={ headerId }
				>
					<IconButton
						onClick={ this.toggleMobile }
						icon={
							mobileOpen ? (
								<Gridicon icon="cross-small" />
							) : (
								<ActivityPanelToggleBubble
									hasUnread={ hasUnread }
								/>
							)
						}
						label={
							mobileOpen
								? __(
										'Close Activity Panel',
										'woocommerce-admin'
								  )
								: viewLabel
						}
						aria-expanded={ mobileOpen }
						tooltip={ false }
						className="woocommerce-layout__activity-panel-mobile-toggle"
					/>
					<div className={ panelClasses }>
						<NavigableMenu
							role="tablist"
							orientation="horizontal"
							className="woocommerce-layout__activity-panel-tabs"
						>
							{ tabs && tabs.map( this.renderTab ) }
						</NavigableMenu>
						{ this.renderPanel() }
					</div>
				</Section>
			</div>
		);
	}
}

export default withSelect( ( select ) => {
	const hasUnreadNotes = getUnreadNotes( select );
	const hasUnreadOrders = getUnreadOrders( select );
	const hasUnreadStock = getUnreadStock();
	const hasUnapprovedReviews = getUnapprovedReviews( select );

	return {
		hasUnreadNotes,
		hasUnreadOrders,
		hasUnreadStock,
		hasUnapprovedReviews,
	};
} )( clickOutside( ActivityPanel ) );
