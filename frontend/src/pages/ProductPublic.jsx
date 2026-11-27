import { CatalogFilters } from '../buyer/CatalogFilters.jsx'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useResource } from '../api/useResource.js'
import { Button, CardGrid, Gallery, Resource } from '../components/UI.jsx'
import { Pagination } from '../components/Pagination.jsx'
import styles from './Products.module.css'

export function Catalog() {
  const [params] = useSearchParams()
  const state = useResource('/products?' + params)
  return (
    <div className="container section stack">
      <header>
        <h1>Khám phá gốm Bát Tràng</h1>
        <p>Các sản phẩm đang trưng bày tại những xưởng đã duyệt.</p>
      </header>
      <CatalogFilters />
      <Resource state={state}>
        {(entries) => (
          <>
            {entries.length ? (
              <CardGrid entries={entries} type="product" />
            ) : (
              <div className="panel">
                <p>Không tìm thấy sản phẩm phù hợp.</p>
                {params.size > 0 && (
                  <Button variant="secondary" to="/kham-pha">
                    Về tất cả sản phẩm
                  </Button>
                )}
              </div>
            )}
            <Pagination
              meta={state.meta}
              toPage={(page) => {
                const next = new URLSearchParams(params)
                next.set('page', page)
                return '/kham-pha?' + next
              }}
            />
          </>
        )}
      </Resource>
    </div>
  )
}

export function rfqLink(product) {
  const query = new URLSearchParams({
    referenceProductId: product.id,
    productSlug: product.slug,
    categoryId: product.category.id,
    workshopSlug: product.workshop.slug,
  })
  return '/buyer/rfq/tao?' + query
}

export function ProductDetail() {
  const { slug } = useParams()
  const state = useResource('/products/' + encodeURIComponent(slug))
  return (
    <div className="container section">
      <p>
        <Link to="/kham-pha">Về trang khám phá</Link>
      </p>
      <Resource state={state}>
        {(product) => (
          <div className="stack">
            <div className={styles.detail}>
              <section className={styles.productImages} aria-label="Ảnh sản phẩm">
                {product.images.length ? <Gallery images={product.images} /> : <p>Chưa có ảnh.</p>}
              </section>
              <div className="stack">
                <header>
                  <p className="muted">{product.category.name}</p>
                  <h1>{product.name}</h1>
                  <p>
                    Xưởng{' '}
                    <Link to={'/xuong/' + product.workshop.slug}>{product.workshop.name}</Link>
                  </p>
                </header>
                <p>
                  <strong>
                    {product.price === null
                      ? 'Liên hệ báo giá'
                      : new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          maximumFractionDigits: 2,
                        }).format(product.price)}
                  </strong>
                </p>
                {product.description && <p className={styles.description}>{product.description}</p>}
                {Object.keys(product.specifications).length > 0 && (
                  <section>
                    <h2>Thông số</h2>
                    <dl>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key}>
                          <dt>
                            <strong>{key}</strong>
                          </dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
                <div>
                  <Button to={rfqLink(product)}>Yêu cầu báo giá (RFQ)</Button>
                </div>
              </div>
            </div>
            <section>
              <h2>Lô sản xuất liên quan</h2>
              {product.batches.length ? (
                <ul>
                  {product.batches.map((batch) => (
                    <li key={batch.batchCode}>
                      <Link to={'/truy-xuat/' + batch.batchCode}>{batch.name}</Link> ·{' '}
                      {batch.quantity} sản phẩm
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Chưa có lô công khai.</p>
              )}
            </section>
            <section>
              <h2>Sản phẩm khác của xưởng</h2>
              <CardGrid entries={product.related} type="product" />
            </section>
          </div>
        )}
      </Resource>
    </div>
  )
}
