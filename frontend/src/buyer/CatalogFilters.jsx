import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Field, Resource } from '../components/UI.jsx'
import { useResource } from '../api/useResource.js'
import { Input } from './BuyerUI.jsx'

function SearchForm({ params, apply, categories }) {
  const initialWorkshop = params.get('workshop') || ''
  const [term, setTerm] = useState(initialWorkshop),
    [lookup, setLookup] = useState('')
  const [chosen, setChosen] = useState(initialWorkshop),
    [error, setError] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setLookup(term.trim()), 250)
    return () => clearTimeout(timer)
  }, [term])
  const hints = useResource('/workshops/suggest?' + new URLSearchParams({ q: lookup }))
  function submit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const [key, value] of data) if (value.trim()) next.set(key, value.trim())
    const match = hints.data?.find((w) => w.name === term || w.slug === term)
    if (term && !chosen && !match) {
      setError('Chọn một xưởng trong danh sách gợi ý.')
      return
    }
    if (term) next.set('workshop', chosen || match.slug)
    if (
      next.has('minPrice') &&
      next.has('maxPrice') &&
      Number(next.get('minPrice')) > Number(next.get('maxPrice'))
    ) {
      setError('Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.')
      return
    }
    setError('')
    apply(next)
  }
  return (
    <form className="panel stack" onSubmit={submit}>
      <div className="buyerInfo">
        <Input label="Tìm sản phẩm" name="q" maxLength={100} defaultValue={params.get('q') || ''} />
        <Field label="Danh mục">
          {(props) => (
            <select {...props} name="categoryId" defaultValue={params.get('categoryId') || ''}>
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tìm xưởng">
          {(props) => (
            <input
              {...props}
              list="buyer-workshop-hints"
              maxLength={100}
              autoComplete="off"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value)
                setChosen('')
              }}
            />
          )}
        </Field>
        <datalist id="buyer-workshop-hints">
          {hints.data?.map((w) => (
            <option key={w.slug} value={w.name}>
              {w.slug}
            </option>
          ))}
        </datalist>
        <Input
          label="Giá từ (VND)"
          type="number"
          name="minPrice"
          min="0"
          max="9999999999.99"
          step=".01"
          defaultValue={params.get('minPrice') || ''}
        />
        <Input
          label="Giá đến (VND)"
          type="number"
          name="maxPrice"
          min="0"
          max="9999999999.99"
          step=".01"
          defaultValue={params.get('maxPrice') || ''}
        />
        <Field label="Sắp xếp">
          {(props) => (
            <select {...props} name="sort" defaultValue={params.get('sort') || ''}>
              <option value="">Mới nhất</option>
              <option value="price">Giá tăng dần</option>
              <option value="-price">Giá giảm dần</option>
              <option value="name">Tên A–Z</option>
            </select>
          )}
        </Field>
      </div>
      {term && hints.error && (
        <p className="error" role="alert">
          {hints.error.message}{' '}
          <button type="button" onClick={hints.reload}>
            Thử lại gợi ý
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="actions">
        <Button type="submit">Áp dụng bộ lọc</Button>
        <Button to="/kham-pha" variant="secondary">
          Xóa bộ lọc
        </Button>
      </div>
    </form>
  )
}
export function CatalogFilters() {
  const [params, setParams] = useSearchParams()
  const categories = useResource('/categories')
  return (
    <Resource state={categories}>
      {(data) => (
        <SearchForm key={params.toString()} params={params} apply={setParams} categories={data} />
      )}
    </Resource>
  )
}
