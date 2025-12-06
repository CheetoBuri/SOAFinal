PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT UNIQUE,
    balance REAL DEFAULT 1000000.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users VALUES('1','huynhnhattien0411@gmail.com','hnt_4','60616f663978719dbbad04dae8af97004b8ca0b9cd9e6c224fa1575a61f635e6','Huynh Nhat Tien','0789925752',749000.0,'2025-12-05 19:16:57');
CREATE TABLE otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT 0
);
INSERT INTO otp_codes VALUES(27,'huynhnhattien0411@gmail.com','071765','2025-12-05 19:06:05','2025-12-06T02:16:05.581016+07:00',0);
INSERT INTO otp_codes VALUES(28,'huynhnhattien0411@gmail.com','091214','2025-12-05 19:08:00','2025-12-06T02:18:00.871968+07:00',1);
INSERT INTO otp_codes VALUES(29,'huynhnhattien0411@gmail.com','019265','2025-12-05 19:10:20','2025-12-06T02:20:20.715329+07:00',0);
CREATE TABLE promo_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent REAL NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    special_notes TEXT,
    promo_code TEXT,
    discount REAL DEFAULT 0,
    payment_method TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    delivery_district TEXT,
    delivery_ward TEXT,
    delivery_street TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_time TIMESTAMP, delivered_at TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
INSERT INTO orders VALUES('72C4AA0E','1','[{"product_id": "cf_8", "product_name": "B\u1ea1c x\u1ec9u", "quantity": 2, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 43000}, {"product_id": "cf_6", "product_name": "C\u00e0 ph\u00ea s\u1eefa \u0111\u00e1", "quantity": 2, "size": "M", "sugar": "0", "milks": [], "toppings": [], "price": 30000}]',146000.0,'delivered','More ice',NULL,0.0,'balance','Huynh Nhat Tien','0789925752','Quận 2','Phường An Khánh','C19 CC BCA','2025-12-06T02:39:31.349580+07:00','2025-12-06T02:39:50.719162+07:00','2025-12-06T02:40:21.170460+07:00');
INSERT INTO orders VALUES('4337ED6B','1','[{"product_id": "cf_8", "product_name": "B\u1ea1c x\u1ec9u", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 53000}, {"product_id": "t_3", "product_name": "Oolong Tea", "quantity": 1, "size": "L", "sugar": "75", "milks": [], "toppings": ["pearls"], "price": 50000}, {"product_id": "t_6", "product_name": "Milk Tea", "quantity": 1, "size": "L", "sugar": "125", "milks": [], "toppings": ["pearls"], "price": 55000}, {"product_id": "j_2", "product_name": "Apple Juice", "quantity": 1, "size": "L", "sugar": "50", "milks": [], "toppings": [], "price": 40000}, {"product_id": "j_4", "product_name": "Lemonade", "quantity": 1, "size": "L", "sugar": "50", "milks": [], "toppings": [], "price": 35000}, {"product_id": "f_1", "product_name": "Croissant", "quantity": 1, "size": "M", "sugar": "0", "milks": [], "toppings": ["almond_slices", "cream_cheese"], "price": 50000}, {"product_id": "f_10", "product_name": "Passion Fruit Mousse", "quantity": 1, "size": "M", "sugar": "0", "milks": [], "toppings": ["passionfruit_topping"], "price": 47000}]',330000.0,'cancelled','More ice',NULL,0.0,'balance','Huynh Nhat Tien','0789925752','Quận 2','Phường An Khánh','C19 CC BCA','2025-12-06T02:41:55.537330+07:00','2025-12-06T02:42:11.148302+07:00',NULL);
INSERT INTO orders VALUES('86F9F081','1','[{"product_id": "cf_2", "product_name": "Americano", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 45000}]',45000.0,'cancelled','More ice',NULL,0.0,'cash','Huynh Nhat Tien','0789925752','Quận Bình Thạnh','Phường 26','C19 CC BCA','2025-12-06T02:45:07.741278+07:00',NULL,NULL);
INSERT INTO orders VALUES('69F975BC','1','[{"product_id": "cf_2", "product_name": "Americano", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 40000}]',40000.0,'delivered','',NULL,0.0,'cash','Huynh Nhat Tien','0789925752','Quận 2','Phường An Phú','C19 CC BCA','2025-12-06T02:48:58.954438+07:00',NULL,'2025-12-06T02:49:11.937126+07:00');
INSERT INTO orders VALUES('70E0DBC8','1','[{"product_id": "cf_1", "product_name": "Espresso", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 35000}]',35000.0,'delivered','',NULL,0.0,'balance','Huynh Nhat Tien','0789925752','Quận 2','Phường An Lợi Đông','C19 CC BCA','2025-12-06T02:50:32.922638+07:00','2025-12-06T02:51:05.538109+07:00','2025-12-06T02:51:19.043998+07:00');
INSERT INTO orders VALUES('7DD68C02','1','[{"product_id": "cf_2", "product_name": "Americano", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 40000}]',40000.0,'delivered','',NULL,0.0,'cash','Huynh Nhat Tien','0789925752','Quận 2','Phường An Khánh','C19 CC BCA','2025-12-06T02:54:07.532002+07:00',NULL,'2025-12-06T02:54:10.628940+07:00');
INSERT INTO orders VALUES('17D99FE1','1','[{"product_id": "cf_2", "product_name": "Americano", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 45000}]',45000.0,'delivered','helo',NULL,0.0,'cash','Huynh Nhat Tien','0789925752','Quận 2','Phường An Khánh','C19 CC BCA','2025-12-06T13:02:32.087846+07:00',NULL,'2025-12-06T13:02:54.012471+07:00');
INSERT INTO orders VALUES('CFD51F87','1','[{"product_id": "cf_2", "product_name": "Americano", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 40000}]',40000.0,'delivered','hello nhé',NULL,0.0,'cash','Huynh Nhat Tien','0789925752','Quận 2','Phường An Khánh','C19 CC BCA','2025-12-06T13:21:23.630932+07:00',NULL,'2025-12-06T13:21:30.308171+07:00');
INSERT INTO orders VALUES('92F3A3AC','1','[{"product_id": "cf_8", "product_name": "B\u1ea1c x\u1ec9u", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 53000}]',53000.0,'cancelled','bruhh',NULL,0.0,'cash','Huynh Nhat Tien','0789925752','Quận 3','Phường 01','C19 CC BCA','2025-12-06T13:22:03.217694+07:00',NULL,NULL);
INSERT INTO orders VALUES('07638B00','1','[{"product_id": "cf_8", "product_name": "B\u1ea1c x\u1ec9u", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": ["whipped_cream"], "price": 48000}, {"product_id": "t_3", "product_name": "Oolong Tea", "quantity": 1, "size": "L", "sugar": "50", "milks": [], "toppings": ["pearls"], "price": 50000}, {"product_id": "j_2", "product_name": "Apple Juice", "quantity": 1, "size": "L", "sugar": "50", "milks": [], "toppings": [], "price": 40000}, {"product_id": "f_1", "product_name": "Croissant", "quantity": 1, "size": "M", "sugar": "0", "milks": [], "toppings": ["salted_butter", "almond_slices", "cream_cheese"], "price": 55000}, {"product_id": "f_4", "product_name": "Cookies (2 pcs)", "quantity": 1, "size": "M", "sugar": "0", "milks": [], "toppings": [], "price": 20000}, {"product_id": "f_10", "product_name": "Passion Fruit Mousse", "quantity": 1, "size": "M", "sugar": "0", "milks": [], "toppings": [], "price": 40000}]',253000.0,'cancelled','nhiều đá nhé',NULL,0.0,'balance','Huynh Nhat Tien','0789925752','Quận 2','Phường Bình Khánh','C19 CC BCA','2025-12-06T13:23:00.742320+07:00','2025-12-06T13:23:14.647592+07:00',NULL);
INSERT INTO orders VALUES('9E299348','1','[{"product_id": "cf_4", "product_name": "Latte", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": ["chocolate_syrup"], "price": 70000}]',70000.0,'delivered','more package sugar',NULL,0.0,'balance','Huynh Nhat Tien','0789925752','Quận 6','Phường 05','C19 CC BCA','2025-12-06T13:24:19.556726+07:00','2025-12-06T13:24:44.149816+07:00','2025-12-06T13:24:48.389726+07:00');
INSERT INTO orders VALUES('C2C1D704','1','[{"product_id": "cf_2", "product_name": "Americano", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 50000}, {"product_id": "cf_8", "product_name": "B\u1ea1c x\u1ec9u", "quantity": 1, "size": "L", "sugar": "0", "milks": [], "toppings": [], "price": 38000}]',88000.0,'delivered','nhiều đá',NULL,0.0,'cash','Huynh Nhat Tien','0789925752','Quận 2','Phường An Lợi Đông','C19 CC BCA','2025-12-06T13:48:45.067408+07:00',NULL,'2025-12-06T13:48:49.835386+07:00');
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE payment_otp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    code TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO payment_otp VALUES(56,'1','EML-83abc19a','757448',0.0,'2025-12-05 19:22:46','2025-12-06T02:32:46.293621+07:00',1);
INSERT INTO payment_otp VALUES(57,'1','PWD-ffdf0fce','546123',0.0,'2025-12-05 19:23:15','2025-12-06T02:33:15+07:00',1);
INSERT INTO payment_otp VALUES(58,'1','PWD-7476a06f','253367',0.0,'2025-12-05 19:27:02','2025-12-06T02:37:02+07:00',1);
INSERT INTO payment_otp VALUES(59,'1','72C4AA0E','368960',146000.0,'2025-12-06T02:39:32.846104+07:00','2025-12-06T02:49:32.846104+07:00',1);
INSERT INTO payment_otp VALUES(60,'1','4337ED6B','607249',330000.0,'2025-12-06T02:41:56.435830+07:00','2025-12-06T02:51:56.435830+07:00',1);
INSERT INTO payment_otp VALUES(61,'1','70E0DBC8','423100',35000.0,'2025-12-06T02:50:33.868882+07:00','2025-12-06T03:00:33.868882+07:00',1);
INSERT INTO payment_otp VALUES(62,'1','07638B00','515434',253000.0,'2025-12-06T13:23:01.671996+07:00','2025-12-06T13:33:01.671996+07:00',1);
INSERT INTO payment_otp VALUES(63,'1','9E299348','081378',70000.0,'2025-12-06T13:24:20.997509+07:00','2025-12-06T13:34:20.997509+07:00',1);
INSERT INTO payment_otp VALUES(64,'1','EML-66aa66b7','308398',0.0,'2025-12-06 06:29:21','2025-12-06T13:39:21.475771+07:00',1);
CREATE TABLE cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    items TEXT NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    balance_before REAL NOT NULL,
    balance_after REAL NOT NULL,
    order_id TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO transactions VALUES('9071AA85-73F','1','payment',-25000.0,865500.0,840500.0,'1B266914','Payment for Order #1B266914','2025-12-04T01:26:17.174991+07:00');
INSERT INTO transactions VALUES('C01A7351-AD0','1','payment',-40000.0,840500.0,800500.0,'A080BE53','Payment for Order #A080BE53','2025-12-04T01:30:43.924325+07:00');
INSERT INTO transactions VALUES('A08D4581-D54','1','payment',-55000.0,800500.0,745500.0,'A7AC0DD8','Payment for Order #A7AC0DD8','2025-12-04T01:33:31.818655+07:00');
INSERT INTO transactions VALUES('D0756306-B80','1','refund',55000.0,745500.0,800500.0,'A7AC0DD8','Refund for cancelled Order #A7AC0DD8','2025-12-04T01:33:45.866484+07:00');
INSERT INTO transactions VALUES('CA794C25-5DB','1','payment',-85000.0,800500.0,715500.0,'8651B80E','Payment for Order #8651B80E','2025-12-04T02:16:30.942233+07:00');
INSERT INTO transactions VALUES('6BDB604C-23D','1','payment',-120000.0,715500.0,595500.0,'1AB6049B','Payment for Order #1AB6049B','2025-12-04T03:50:51.534708+07:00');
INSERT INTO transactions VALUES('72461BA3-FEF','1','payment',-233000.0,595500.0,362500.0,'F282B8AD','Payment for Order #F282B8AD','2025-12-04T17:44:22.028058+07:00');
INSERT INTO transactions VALUES('166F90DC-5F9','1','refund',233000.0,362500.0,595500.0,'F282B8AD','Refund for cancelled Order #F282B8AD','2025-12-04T17:44:34.945039+07:00');
INSERT INTO transactions VALUES('E8570719-67B','1','payment',-133000.0,595500.0,462500.0,'3E65B7DD','Payment for Order #3E65B7DD','2025-12-04T22:00:53.062526+07:00');
INSERT INTO transactions VALUES('C68FC447-9B9','1','payment',-129000.0,462500.0,333500.0,'EE6436F4','Payment for Order #EE6436F4','2025-12-04T22:34:12.319347+07:00');
INSERT INTO transactions VALUES('AEF9905F-87E','1','payment',-165000.0,333500.0,168500.0,'1882D829','Payment for Order #1882D829','2025-12-04T22:46:27.798153+07:00');
INSERT INTO transactions VALUES('C973B234-C4E','1','payment',-120000.0,168500.0,48500.0,'CEAD798C','Payment for Order #CEAD798C','2025-12-04T22:56:17.922275+07:00');
INSERT INTO transactions VALUES('2A306902-19E','1','payment',-35000.0,48500.0,13500.0,'5541C6D3','Payment for Order #5541C6D3','2025-12-04T22:59:21.203744+07:00');
INSERT INTO transactions VALUES('A7413EDD-A39','1','payment',-188000.0,1000000.0,812000.0,'DAA8125E','Payment for Order #DAA8125E','2025-12-05T01:15:30.747270+07:00');
INSERT INTO transactions VALUES('C0824435-694','1','payment',-80000.0,812000.0,732000.0,'A6BD0B0C','Payment for Order #A6BD0B0C','2025-12-05T02:04:31.394561+07:00');
INSERT INTO transactions VALUES('7535B8EC-1ED','1','payment',-105000.0,732000.0,627000.0,'6D60DAD7','Payment for Order #6D60DAD7','2025-12-05T13:02:06.504674+07:00');
INSERT INTO transactions VALUES('985C0A70-92A','1','payment',-30000.0,627000.0,597000.0,'A84EF581','Payment for Order #A84EF581','2025-12-05T13:13:50.991403+07:00');
INSERT INTO transactions VALUES('A111DA44-D2F','1','payment',-25000.0,597000.0,572000.0,'E073C2F7','Payment for Order #E073C2F7','2025-12-05T13:28:30.721992+07:00');
INSERT INTO transactions VALUES('4687D3FC-375','1','payment',-30000.0,572000.0,542000.0,'5DF291FA','Payment for Order #5DF291FA','2025-12-05T18:53:46.994712+07:00');
INSERT INTO transactions VALUES('539E86D9-82E','1','payment',-205000.0,542000.0,337000.0,'C4FBC2B3','Payment for Order #C4FBC2B3','2025-12-05T20:13:49.668077+07:00');
INSERT INTO transactions VALUES('90D6AFEE-BC5','1','refund',205000.0,337000.0,542000.0,'C4FBC2B3','Refund for cancelled Order #C4FBC2B3','2025-12-05T20:14:42.351352+07:00');
INSERT INTO transactions VALUES('A1C9B76D-DA5','1','payment',-25000.0,542000.0,517000.0,'414408FA','Payment for Order #414408FA','2025-12-05T23:13:56.458624+07:00');
INSERT INTO transactions VALUES('E78D7758-679','1','payment',-146000.0,1000000.0,854000.0,'72C4AA0E','Payment for Order #72C4AA0E','2025-12-06T02:39:50.719162+07:00');
INSERT INTO transactions VALUES('62D94AB7-C82','1','payment',-330000.0,854000.0,524000.0,'4337ED6B','Payment for Order #4337ED6B','2025-12-06T02:42:11.148302+07:00');
INSERT INTO transactions VALUES('74DA2115-BC5','1','refund',330000.0,524000.0,854000.0,'4337ED6B','Refund for cancelled Order #4337ED6B','2025-12-06T02:42:34.110838+07:00');
INSERT INTO transactions VALUES('2FD3C997-8F0','1','payment',-35000.0,854000.0,819000.0,'70E0DBC8','Payment for Order #70E0DBC8','2025-12-06T02:51:05.538109+07:00');
INSERT INTO transactions VALUES('66FE247A-954','1','payment',-253000.0,819000.0,566000.0,'07638B00','Payment for Order #07638B00','2025-12-06T13:23:14.647592+07:00');
INSERT INTO transactions VALUES('4C3956A6-D40','1','refund',253000.0,566000.0,819000.0,'07638B00','Refund for cancelled Order #07638B00','2025-12-06T13:23:29.911852+07:00');
INSERT INTO transactions VALUES('694F9D24-23C','1','payment',-70000.0,819000.0,749000.0,'9E299348','Payment for Order #9E299348','2025-12-06T13:24:44.149816+07:00');
INSERT INTO sqlite_sequence VALUES('otp_codes',29);
INSERT INTO sqlite_sequence VALUES('payment_otp',64);
INSERT INTO sqlite_sequence VALUES('favorites',149);
INSERT INTO sqlite_sequence VALUES('cart',4);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_otp_code ON otp_codes(code);
CREATE INDEX idx_promo_code ON promo_codes(code);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);
CREATE INDEX idx_payment_otp_user ON payment_otp(user_id);
CREATE INDEX idx_payment_otp_order ON payment_otp(order_id);
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
COMMIT;
