<?php
/**
 * WooCommerce Onboarding Tasks
 * NOTE: DO NOT edit this file in WooCommerce core, this is generated from woocommerce-admin.
 *
 * @package Woocommerce Admin
 */

namespace Automattic\WooCommerce\Admin\Features;

use \Automattic\WooCommerce\Admin\Loader;

/**
 * Shows print shipping label banner on edit order page.
 */
class ShippingLabelBanner {
	/**
	 * Supported countries by USPS, see: https://webpmt.usps.gov/pmt010.cfm
	 *
	 * @var array
	 */
	private $supported_countries = array( 'US', 'AS', 'PR', 'VI', 'GU', 'MP', 'UM', 'FM', 'MH' );

	/**
	 * Array of supported currency codes.
	 *
	 * @var array
	 */
	private $supported_currencies = array( 'USD' );

	/**
	 * Constructor
	 */
	public function __construct() {
		if ( ! is_admin() ) {
			return;
		}
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ), 6, 2 );
		add_filter( 'woocommerce_components_settings', array( $this, 'component_settings' ), 20 );
		add_filter( 'woocommerce_shared_settings', array( $this, 'component_settings' ), 20 );
	}

	/**
	 * Check if WooCommerce Shipping makes sense for this merchant.
	 *
	 * @return bool
	 */
	private function should_show_meta_box() {
		$order = wc_get_order();

		if ( ! $order ) {
			return false;
		}
		// Restrict showing the metabox to supported store currencies.
		$base_currency = get_woocommerce_currency();
		if ( ! $this->is_supported_currency( $base_currency ) ) {
			return false;
		}

		$base_location = wc_get_base_location();
		if ( ! $this->is_supported_country( $base_location['country'] ) ) {
			return false;
		}

		// At this point (no packaging data), only show if there's at least one existing and shippable product.
		foreach ( $order->get_items() as $item ) {
			if ( $item instanceof \WC_Order_Item_Product ) {
				$product = $item->get_product();
				if ( $product && $product->needs_shipping() ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Add metabox to order page.
	 *
	 * @param string  $post_type current post type.
	 * @param \WP_Post $post Current post object.
	 */
	public function add_meta_boxes( $post_type, $post ) {
		$order = wc_get_order( $post );
		if ( $this->should_show_meta_box() ) {
			add_meta_box(
				'woocommerce-admin-print-label',
				__( 'Shipping Label', 'woocommerce-admin' ),
				array( $this, 'meta_box' ),
				null,
				'normal',
				'high',
				array(
					'context' => 'shipping_label',
					'order_id' => $post->ID,
					'shippable_items_count' => $this->count_shippable_items( $order ),

				)
			);
			add_action( 'admin_enqueue_scripts', array( $this, 'add_print_shipping_label_script' ) );
		}
	}

	private function count_shippable_items( \WC_Order $order) {
		$count = 0;
		foreach ( $order->get_items() as $item ) {
			if ( $item instanceof \WC_Order_Item_Product ) {
				$product = $item->get_product();
				if ( $product && $product->needs_shipping() ) {
					$count += $item->get_quantity();
				}
			}
		}
		return $count;
	}
	/**
	 * Adds JS to order page to render shipping banner.
	 *
	 * @param string $hook current page hook.
	 */
	public function add_print_shipping_label_script( $hook ) {
		wp_enqueue_style(
			'print-shipping-label-banner-style',
			Loader::get_url( 'print-shipping-label-banner/style.css' ),
			array(),
			Loader::get_file_version( 'print-shipping-label-banner/style.css' )
		);

		wp_enqueue_script(
			'print-shipping-label-banner',
			Loader::get_url( 'wp-admin-scripts/print-shipping-label-banner.js' ),
			array( 'wc-navigation', 'wp-i18n', 'wp-data', 'wp-element', 'moment', 'wp-api-fetch' ),
			Loader::get_file_version( 'wp-admin-scripts/print-shipping-label-banner.js' ),
			true
		);
	}

	/**
	 * Render placeholder metabox.
	 *
	 * @param \WP_Post $post current post.
	 * @param array   $args empty args.
	 */
	public function meta_box( $post, $args ) {

		?>
		<div id="wc-admin-shipping-banner-root" class=" woocommerce <?php echo esc_attr( 'wc-admin-shipping-banner' ); ?>" data-args="<?php echo esc_attr( wp_json_encode( $args['args'] ) ); ?>">
			Shipping label banner goes here
		</div>
		<?php
	}

	/**
	 * Check if country code is supported by WCS.
	 *
	 * @param string $country_code Country code.
	 *
	 * @return bool
	 */
	private function is_supported_country( $country_code ) {
		return in_array( $country_code, $this->supported_countries, true );
	}

	/**
	 * Check if currency code is supported by WCS.
	 *
	 * @param string $currency_code Currency code.
	 *
	 * @return bool
	 */
	private function is_supported_currency( $currency_code ) {
		return in_array( $currency_code, $this->supported_currencies, true );
	}

	/**
	 * Return a set of shared settings for the react component. The settings can be
	 * retrieve in component with getSetting('shippingBanner');
	 *
	 * @param array $settings Component settings.
	 * @return array
	 */
	public function component_settings( $settings ) {
		$active_plugins    = Onboarding::get_active_plugins();
		$installed_plugins = Onboarding::get_installed_plugins();

		$settings['shippingBanner']['isJetPackInstalled']             = in_array( 'jetpack', $installed_plugins, true );
		$settings['shippingBanner']['isWooCommerceServicesInstalled'] = in_array( 'woocommerce-services', $installed_plugins, true );
		return $settings;
	}
}
