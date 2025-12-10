import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';

const SUPABASE_URL = 'https://yvphjvmlvimizgodzpcw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cGhqdm1sdmltaXpnb2R6cGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTAwMzMsImV4cCI6MjA4MDMyNjAzM30.gPiWf29LNH8uVhfDC8Ty9v0RCIjP8eb6cVu2shyZLrE';

// KHỚP VỚI BẢNG: name là khóa chính, không có id
type Product = {
  name: string;
  price: number;
  old_price?: number | null;
  badge?: string | null;
  image?: string | null;
};

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');

  const formatPrice = (price?: number | null) => {
    if (typeof price !== 'number') return '';
    return price.toLocaleString('vi-VN') + '₫';
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });

        console.log('STATUS:', res.status);

        if (!res.ok) {
          throw new Error('Request failed: ' + res.status);
        }

        const data = (await res.json()) as Product[];
        console.log('DATA:', data);

        setProducts(data);
      } catch (err) {
        console.log('Lỗi load sản phẩm từ Supabase REST:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    console.log('Thêm vào giỏ:', product.name);
  };

  // Filter theo ô tìm kiếm (optional)
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Xin chào,</Text>
            <Text style={styles.userName}>Khách hàng</Text>
          </View>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>0</Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* BANNER */}
        <View style={styles.banner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Khuyến mãi hôm nay</Text>
            <Text style={styles.bannerSubtitle}>
              Giảm giá lên đến 50% cho một số sản phẩm nổi bật.
            </Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Xem ngay</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bannerImagePlaceholder}>
            <Text style={styles.bannerImageText}>Banner</Text>
          </View>
        </View>

        {/* TIÊU ĐỀ SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
        </View>

        {/* LIST SẢN PHẨM */}
        {loadingProducts ? (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Đang tải sản phẩm...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text>Không tìm thấy sản phẩm phù hợp.</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((prod) => (
              <View
                key={prod.name} // name là khóa chính, luôn unique
                style={styles.productCard}
              >
                <View style={styles.productImageWrapper}>
                  {prod.image ? (
                    <Image
                      source={{ uri: prod.image }}
                      style={styles.productImage}
                      resizeMode="cover" // dùng prop, không dùng style.resizeMode
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text style={styles.productImageText}>Ảnh</Text>
                    </View>
                  )}

                  {prod.badge ? (
                    <View style={styles.productBadge}>
                      <Text style={styles.productBadgeText}>{prod.badge}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.productInfo}>
  <Text numberOfLines={2} style={styles.productName}>
    {prod.name}
  </Text>

  {/* Giá hiện tại */}
  <Text style={styles.productPrice}>
    {formatPrice(prod.price)}
  </Text>

  {/* Giá gốc nằm dưới, luôn an toàn, không tràn */}
  {prod.old_price ? (
    <Text style={styles.productOldPrice}>
      {formatPrice(prod.old_price)}
    </Text>
  ) : null}
</View>


                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToCart(prod)}
                >
                  <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
  },

  // HEADER
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    color: '#6b7280',
    fontSize: 13,
  },
  userName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  cartBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 13,
  },

  // SEARCH
  searchBox: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  // BANNER
  banner: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  bannerTextContainer: {
    flex: 1.4,
  },
  bannerTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#dbeafe',
    fontSize: 13,
    marginBottom: 10,
  },
  bannerButton: {
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fefce8',
    fontWeight: '600',
    fontSize: 13,
  },
  bannerImagePlaceholder: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImageText: {
    color: '#bfdbfe',
    fontSize: 12,
  },

  // SECTION
  sectionHeaderRow: {
    marginTop: 8,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },

  // PRODUCTS GRID
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 240,
  },
  productImageWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: 130,
    borderRadius: 10,
    // bỏ resizeMode ở đây, dùng prop trong <Image />
  },
  productImagePlaceholder: {
    height: 130,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  productBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productBadgeText: {
    color: '#fefce8',
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    flexGrow: 1,
  },
  productName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 18,
    height: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',          // cho phép xuống dòng nếu dài
    gap: 2,                    // khoảng cách nhỏ giữa 2 giá
    marginBottom: 4,
  },
  productPrice: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 4,
  },
 productOldPrice: {
  color: '#9ca3af',
  fontSize: 11,
  textDecorationLine: 'line-through',
  marginTop: 2,
},
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '600',
  },
});
