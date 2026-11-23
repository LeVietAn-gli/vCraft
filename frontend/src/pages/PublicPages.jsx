import { useParams, Link } from 'react-router-dom'
import { useResource } from '../api/useResource.js'
import { CardGrid, Gallery, Resource } from '../components/UI.jsx'
import { week } from './WorkshopEditor.jsx'

export function Catalog() {
  const state = useResource('/products')
  return (
    <div className="container section">
      <h1>Khám phá gốm Bát Tràng</h1>
      <Resource state={state}>
        {(entries) => <CardGrid entries={entries} type="product" />}
      </Resource>
    </div>
  )
}

export function Village() {
  const state = useResource('/workshops/map')
  return (
    <div className="container section">
      <h1>Ghé các xưởng gốm</h1>
      <p>Xem vị trí và lịch đón khách của từng xưởng.</p>
      <Resource state={state}>
        {(entries) =>
          entries.length ? (
            <ul>
              {entries.map((entry) => (
                <li key={entry.slug}>
                  <Link to={'/xuong/' + entry.slug}>{entry.name}</Link>
                  {' · '}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${entry.latitude}&mlon=${entry.longitude}#map=17/${entry.latitude}/${entry.longitude}`}
                  >
                    Xem vị trí trên OpenStreetMap
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>Chưa có xưởng công khai với tọa độ.</p>
          )
        }
      </Resource>
    </div>
  )
}

export function Workshop() {
  const { slug } = useParams()
  const state = useResource('/workshops/' + encodeURIComponent(slug))
  return (
    <div className="container narrow section">
      <Resource state={state}>
        {(data) => (
          <div className="stack">
            <header>
              <h1>{data.name}</h1>
              <p>{data.address}</p>
              <p>{data.description}</p>
            </header>
            <section>
              <h2>Câu chuyện gia đình</h2>
              <p>{data.history || 'Xưởng chưa ghi thêm lịch sử gia đình.'}</p>
            </section>
            {data.images.length > 0 && (
              <section>
                <h2>Ảnh xưởng</h2>
                <Gallery images={data.images} />
              </section>
            )}
            <section>
              <h2>Giờ tham quan</h2>
              {data.isOpenForVisit ? (
                <ul>
                  {week.flatMap(([key, title]) =>
                    (data.openingHours[key] ?? []).map(([start, end]) => (
                      <li key={key + start}>
                        {title} · {start}–{end}
                      </li>
                    )),
                  )}
                </ul>
              ) : (
                <p>Xưởng chưa nhận khách tham quan.</p>
              )}
            </section>
            {data.certificates.length > 0 && (
              <section>
                <h2>Chứng nhận</h2>
                <ul>
                  {data.certificates.map((entry) => (
                    <li key={entry.id}>
                      <a href={entry.fileUrl}>
                        {entry.title} · {entry.issuer}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data.batches.length > 0 && (
              <section>
                <h2>Lô sản xuất công khai</h2>
                <ul>
                  {data.batches.map((batch) => (
                    <li key={batch.batchCode}>
                      <Link to={'/truy-xuat/' + batch.batchCode}>{batch.name}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Resource>
    </div>
  )
}

export function Trace() {
  const { maLo } = useParams()
  const state = useResource('/trace/' + encodeURIComponent(maLo))
  return (
    <div className="container narrow section">
      <Resource state={state}>
        {(batch) => (
          <div className="stack">
            <header>
              <p>Mã lô {batch.batchCode}</p>
              <h1>{batch.name}</h1>
              <Link to={'/xuong/' + batch.workshop.slug}>{batch.workshop.name}</Link>
            </header>
            {batch.status === 'CANCELLED' && <p className="error">Đã hủy</p>}
            <section>
              <h2>Sản phẩm cùng lô</h2>
              <ul>
                {batch.products.map((item) => (
                  <li key={item.slug}>
                    {item.name} · {item.quantity}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2>Nhật ký sản xuất</h2>
              <ol>
                {batch.milestones.map((entry) => (
                  <li key={entry.orderIndex}>
                    <h3>{entry.title}</h3>
                    <p>
                      {entry.occurredAt
                        ? new Intl.DateTimeFormat('vi-VN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                            timeZone: 'Asia/Ho_Chi_Minh',
                          }).format(new Date(entry.occurredAt))
                        : 'Chưa ghi thời điểm'}
                    </p>
                    <p>{entry.description}</p>
                    <Gallery images={entry.images} />
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </Resource>
    </div>
  )
}
