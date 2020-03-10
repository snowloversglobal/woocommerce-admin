import { render } from '@wordpress/element';
import ShippingBanner from './shipping-banner';
import 'wc-api/wp-data-store';

const metaBox = document.getElementById( 'wc-admin-shipping-banner-root' );
const args =
	( metaBox.dataset.args && JSON.parse( metaBox.dataset.args ) ) || {};

// Render the header.
render( <ShippingBanner itemsCount={ args.shippable_items_count } />, metaBox );
