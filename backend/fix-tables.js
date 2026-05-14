/**
 * Create missing tables for admin dashboard
 */
require('dotenv').config();
const database = require('./config/database');

async function createTable(name, sql) {
  try {
    await database.query(sql);
    console.log(`  ✅ ${name}`);
    return true;
  } catch (err) {
    if (err.message && err.message.includes('ER_TABLE_EXISTS_ERROR')) {
      console.log(`  ⏭️  ${name} (already exists)`);
      return true;
    }
    console.error(`  ❌ ${name}: ${err.message.substring(0, 120)}`);
    return false;
  }
}

async function insertSample(name, sql) {
  try {
    await database.query(sql);
    console.log(`  ✅ ${name} sample data`);
  } catch (err) {
    if (err.message && (err.message.includes('Duplicate') || err.message.includes("doesn't exist"))) {
      console.log(`  ⏭️  ${name} sample (skipped)`);
    } else {
      console.error(`  ❌ ${name} sample: ${err.message.substring(0, 120)}`);
    }
  }
}

async function run() {
  console.log('Creating missing tables...\n');

  await createTable('hero_banners', `
    CREATE TABLE IF NOT EXISTS hero_banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      subtitle VARCHAR(255),
      description TEXT,
      image VARCHAR(500) NOT NULL,
      mobile_image VARCHAR(500),
      button_text VARCHAR(100),
      button_link VARCHAR(500),
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      start_date DATE,
      end_date DATE,
      click_count INT DEFAULT 0,
      view_count INT DEFAULT 0,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_display_order (display_order),
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable('flash_sales', `
    CREATE TABLE IF NOT EXISTS flash_sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
      discount_value DECIMAL(10, 2) NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      banner_image VARCHAR(500),
      display_on_homepage BOOLEAN DEFAULT TRUE,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_active (is_active),
      INDEX idx_times (start_time, end_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable('flash_sale_products', `
    CREATE TABLE IF NOT EXISTS flash_sale_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flash_sale_id INT NOT NULL,
      product_id INT NOT NULL,
      special_price DECIMAL(10, 2),
      quantity_limit INT,
      sold_count INT DEFAULT 0,
      FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_flash_sale_id (flash_sale_id),
      INDEX idx_product_id (product_id),
      UNIQUE KEY unique_sale_product (flash_sale_id, product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable('testimonials', `
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_image VARCHAR(500),
      customer_location VARCHAR(255),
      rating INT DEFAULT 5,
      content TEXT NOT NULL,
      product_id INT,
      is_active BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 0,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      INDEX idx_active (is_active),
      INDEX idx_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable('coupons', `
    CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
      discount_value DECIMAL(10, 2) NOT NULL,
      min_order_amount DECIMAL(10, 2) DEFAULT 0,
      max_discount DECIMAL(10, 2),
      usage_limit INT DEFAULT NULL,
      user_limit INT DEFAULT 1,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      applicable_categories JSON,
      applicable_products JSON,
      usage_count INT DEFAULT 0,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_code (code),
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable('coupon_usage', `
    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INT AUTO_INCREMENT PRIMARY KEY,
      coupon_id INT NOT NULL,
      user_id INT,
      firebase_uid VARCHAR(128),
      order_id INT,
      discount_amount DECIMAL(10, 2),
      used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
      INDEX idx_coupon_id (coupon_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable('restock_notifications', `
    CREATE TABLE IF NOT EXISTS restock_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT,
      firebase_uid VARCHAR(128),
      email VARCHAR(255),
      phone VARCHAR(20),
      is_notified BOOLEAN DEFAULT FALSE,
      notification_sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_product_id (product_id),
      INDEX idx_is_notified (is_notified)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('\nInserting sample data...\n');

  await insertSample('hero_banners', `
    INSERT INTO hero_banners (title, subtitle, image, button_text, button_link, display_order, is_active)
    VALUES
    ('Welcome to Little Shop', 'Traditional Sarees from Dharapuram', 'https://res.cloudinary.com/littleshop/image/upload/v1/banners/hero-1.jpg', 'Shop Now', '/products', 1, TRUE),
    ('New Arrivals', 'Check out our latest collection', 'https://res.cloudinary.com/littleshop/image/upload/v1/banners/hero-2.jpg', 'Explore', '/products?sort=new', 2, TRUE)
  `);

  await insertSample('testimonials', `
    INSERT INTO testimonials (customer_name, customer_location, rating, content, is_active, display_order)
    VALUES
    ('Priya Kumar', 'Chennai', 5, 'Beautiful sarees! The quality is amazing and delivery was fast.', TRUE, 1),
    ('Lakshmi R', 'Coimbatore', 5, 'Love the traditional designs. Will definitely order again!', TRUE, 2)
  `);

  await database.end();
  console.log('\n🎉 Done! Restart backend: node server.js');
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
