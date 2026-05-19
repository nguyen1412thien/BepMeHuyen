-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `bep_me_huyen` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bep_me_huyen`;

-- 1. Create Menu Items Table
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(12, 2) NOT NULL, -- Storing prices in VND
  `category` VARCHAR(100) NOT NULL, -- 'Main Course', 'Soup', 'Side Dish', 'Dessert', 'Drinks'
  `image_url` VARCHAR(500),
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `customer_address` TEXT NOT NULL,
  `notes` TEXT,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Preparing', 'Delivering', 'Completed', 'Cancelled'
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create Order Items Table
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `menu_item_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Menu Items with premium Vietnamese dishes
INSERT INTO `menu_items` (`name`, `description`, `price`, `category`, `image_url`) VALUES
('Thịt Kho Tàu Mẹ Nấu', 'Thịt ba chỉ heo kho rệu mềm ngấm vị cùng trứng vịt, nước dừa xiêm ngọt thanh đậm đà chuẩn vị cơm nhà.', 75000.00, 'Main Course', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Cá Lóc Kho Tộ', 'Cá lóc đồng kho tộ sền sệt, cay nồng tiêu sọ, thơm hành lá và mỡ hành béo ngậy ăn cực hao cơm.', 80000.00, 'Main Course', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Sườn Xào Chua Ngọt', 'Sườn non rim chín mềm, áo lớp sốt chua ngọt từ cà chua và me rừng thơm lừng, rắc chút vừng rang thơm phức.', 85000.00, 'Main Course', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Canh Chua Cá Lóc Nam Bộ', 'Canh chua cá lóc nấu kèm dọc mùng, đậu bắp, thơm, cà chua, ngò om ngò gai và giá đỗ, thanh mát giải nhiệt.', 85000.00, 'Soup', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Canh Cua Rau Đay Mướp Hương', 'Rau đay thanh mát nấu cùng cua đồng băm nhỏ nhiều gạch béo ngậy, đi kèm vài quả cà pháo muối chua giòn rụm.', 60000.00, 'Soup', 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Rau Muống Xào Tỏi Cô Đơn', 'Rau muống xanh giòn sần sật xào nhanh tay trên lửa lớn với tỏi Lý Sơn thơm nồng nàn.', 40000.00, 'Side Dish', 'https://images.unsplash.com/photo-1515003848606-ca0597947d6e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Trứng Cuộn Vân Hoa', 'Trứng gà ta cuộn khéo léo với hành hoa và cà rốt băm nhỏ, màu sắc bắt mắt, mềm xốp tan trong miệng.', 35000.00, 'Side Dish', 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Chè Dưỡng Nhan Tuyết Yến', 'Chè tuyết yến kết hợp táo đỏ, kỷ tử, long nhãn, hạt sen và nhựa đào ngọt dịu thanh tao, cực kỳ bổ dưỡng.', 45000.00, 'Dessert', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Nước Sấu Đá Hà Nội', 'Quả sấu tươi ngâm đường phèn giòn ngọt kết hợp gừng tươi cay ấm, đá lạnh sảng khoái ngày hè.', 25000.00, 'Drinks', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Trà Hoa Cúc Mật Ong', 'Trà hoa cúc sấy lạnh pha cùng mật ong rừng tự nhiên ấm áp, thư giãn cơ thể buổi tối.', 30000.00, 'Drinks', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3');
