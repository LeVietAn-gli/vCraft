import { ArrowUpRight, MapPin } from 'lucide-react'
import { useResource } from '../api/useResource.js'
import { Button, CardGrid, Gallery, Resource } from '../components/UI.jsx'
import styles from './Home.module.css'

const gallery = [
  {
    id: 'vuot',
    altText: 'Vuốt dáng trên bàn xoay',
    thumbUrl: '/images/tho-gom-720.webp',
    imageUrl: '/images/tho-gom.webp',
  },
  {
    id: 've',
    altText: 'Vẽ họa tiết men lam',
    thumbUrl: '/images/ve-men-lam-720.webp',
    imageUrl: '/images/ve-men-lam.webp',
  },
  {
    id: 'gom',
    altText: 'Bình và chén men lam',
    thumbUrl: '/images/gom-men-lam-720.webp',
    imageUrl: '/images/gom-men-lam.webp',
  },
]

export function ExhibitionHome({ featured, studios, news, map, wholesale }) {
  return (
    <>
      <section className={styles.hero} aria-labelledby="exhibition-title">
        <img
          src="/images/tho-gom.webp"
          srcSet="/images/tho-gom-720.webp 720w, /images/tho-gom.webp 1440w"
          sizes="100vw"
          width="1440"
          height="960"
          fetchPriority="high"
          alt="Nghệ nhân gốm vuốt bình trên bàn xoay"
        />
        <div className={styles.heroCopy}>
          <p>BÁT TRÀNG · TRIỂN LÃM SỐ</p>
          <h1 id="exhibition-title">
            Tinh hoa làng nghề,
            <br />
            muôn phương lan tỏa
          </h1>
          <div className="actions">
            <Button to="/kham-pha">
              Khám phá sản phẩm <ArrowUpRight size={17} aria-hidden="true" />
            </Button>
            <Button to="/lang-nghe" variant="secondary">
              <MapPin size={17} aria-hidden="true" /> Xem bản đồ làng
            </Button>
          </div>
        </div>
      </section>
      <p className={styles.credit}>Ảnh minh họa tạo bằng OpenAI ImageGen</p>
      <div className="container section">
        <section className={styles.story} aria-labelledby="story-title">
          <img
            src="/images/ve-men-lam-720.webp"
            alt="Cọ vẽ họa tiết xanh lam trên bát gốm"
            loading="lazy"
            width="720"
            height="480"
          />
          <div>
            <h2 id="story-title">Từ đất đến men</h2>
            <p>
              Đất được vuốt trên bàn xoay, hong khô rồi vẽ và phủ men trước khi vào lò. Sắc men và
              nét cọ ghi lại dấu tay người làm gốm Bát Tràng.
            </p>
          </div>
        </section>
        <section className={styles.section}>
          <h2>Nhìn gần nghề gốm</h2>
          <Gallery images={gallery} />
        </section>
        {featured}
        {studios}
        {map}
        {news}
        {wholesale}
      </div>
    </>
  )
}

export default function Home() {
  const products = useResource('/products')
  const workshops = useResource('/workshops?limit=8')
  return (
    <ExhibitionHome
      featured={
        <section className={styles.section}>
          <h2>Sản phẩm tiêu biểu</h2>
          <Resource state={products}>
            {(entries) => <CardGrid type="product" entries={entries.slice(0, 8)} />}
          </Resource>
        </section>
      }
      studios={
        <section className={styles.section}>
          <h2>Gặp gỡ nghệ nhân</h2>
          <Resource state={workshops}>
            {(entries) => <CardGrid type="workshop" entries={entries} />}
          </Resource>
        </section>
      }
      map={
        <section className={styles.section}>
          <h2>Ghé thăm xưởng</h2>
          <Button to="/lang-nghe" variant="secondary">
            Xem vị trí và giờ tham quan
          </Button>
        </section>
      }
    />
  )
}
