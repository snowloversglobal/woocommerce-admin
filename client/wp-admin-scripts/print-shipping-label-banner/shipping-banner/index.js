/**
 * External dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { ExternalLink, Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { recordEvent } from 'lib/tracks';

/**
 * Internal dependencies
 */
import '../style.scss';
import DismissModal from '../dismiss-modal';
import { getSetting } from '@woocommerce/wc-admin-settings';
import withSelect from 'wc-api/with-select';

const wcAdminAssetUrl = getSetting( 'wcAdminAssetUrl', '' );

class ShippingBanner extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			showShippingBanner: true, // TODO: update to get state when closedForever is clicked
			isDismissModalOpen: false,
		};
	}

	componentDidMount() {
		this.trackBannerEvent( 'shipping_banner_show' );
	}

	closeDismissModal = () => {
		this.setState( { isDismissModalOpen: false } );
		this.trackBannerEvent(
			'shipping_banner_dismiss_modal_close_button_click'
		);
	};

	openDismissModal = () => {
		this.setState( { isDismissModalOpen: true } );
		this.trackBannerEvent( 'shipping_banner_dimiss_click' );
	};

	hideBanner = () => {
		this.setState( { showShippingBanner: false } );
	};

	createShippingLabelClicked = () => {
		// TODO: install and activate WCS
		// TODO: open WCS modal
		this.trackBannerEvent( 'shipping_banner_create_label_click' );
	};

	learnMoreClicked = () => {
		this.trackBannerEvent( 'shipping_banner_learn_more_click' );
	};

	trackBannerEvent = ( eventName ) => {
		recordEvent( eventName, {
			jetpack_installed: this.activePlugins.includes( 'jetpack' ),
			jetpack_connected: this.isJetpackConnected,
			wcs_installed: this.activePlugins.includes(
				'woocommerce-services'
			),
		} );
	};

	render() {
		const { isDismissModalOpen, showShippingBanner } = this.state;
		const { itemsCount } = this.props;
		if ( ! showShippingBanner ) {
			return null;
		}

		return (
			<div>
				<div className="wc-admin-shipping-banner-container">
					<img
						className="wc-admin-shipping-banner-illustration"
						src={ wcAdminAssetUrl + 'shippingillustration.svg' }
						alt={ __( 'Shipping ', 'woocommerce-admin' ) }
					/>
					<h3>
						{ sprintf(
							_n(
								'Fulfill %d item with WooCommerce Shipping',
								'Fulfill %d items with WooCommerce Shipping',
								itemsCount,
								'woocommerce-admin'
							),
							itemsCount
						) }
					</h3>
					<p>
						{ __(
							'Print discounted shipping labels with a click. This will install WooCommerce Services. '
						) }
						<ExternalLink
							href="woocommerce.com"
							onClick={ this.learnMoreClicked }
						>
							{ __( 'Learn More', 'woocommerce-admin' ) }
						</ExternalLink>
					</p>
					<Button
						isPrimary
						onClick={ this.createShippingLabelClicked }
					>
						{ __( 'Create shipping label' ) }
					</Button>
					<button
						onClick={ this.openDismissModal }
						type="button"
						className="notice-dismiss"
					>
						<span className="screen-reader-text">
							{ __(
								'Close Print Label Banner.',
								'woocommerce-admin'
							) }
						</span>
					</button>
				</div>
				<DismissModal
					visible={ isDismissModalOpen }
					onClose={ this.closeDismissModal }
					onCloseAll={ this.hideBanner }
					trackBannerEvent={ this.trackBannerEvent }
				/>
			</div>
		);
	}
}

export default compose(
	withSelect( ( select ) => {
		const { getActivePlugins, isJetpackConnected } = select( 'wc-api' );
		return {
			activePlugins: getActivePlugins(),
			isJetpackConnected: isJetpackConnected(),
		};
	} )
)( ShippingBanner );
