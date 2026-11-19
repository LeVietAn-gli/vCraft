import test from 'node:test';
import assert from 'node:assert/strict';
import { onlyInternalNext } from '../../frontend/src/utils/format.js';
import { slugify, newCode } from '../src/utils/code.js';

test('chỉ chuyển hướng tới đường dẫn nội bộ hợp lệ sau đăng nhập', () => {
  assert.equal(onlyInternalNext('/buyer/rfqs/abc'), '/buyer/rfqs/abc');
  for (const invalid of ['https://evil.example/', '//evil.example/', '/\\evil', '/dang-nhap?next=/', '/dang-ky', '', '\n', null]) {
    assert.equal(onlyInternalNext(invalid), '/buyer/rfqs');
  }
});
test('tạo slug ASCII ổn định với dấu tiếng Việt', () => {
  assert.equal(slugify('Gốm Bát Tràng – Đất Việt!'), 'gom-bat-trang-dat-viet');
});
test('mã mới có định dạng gọn và entropy từ randomBytes', () => {
  const one = newCode('RFQ'), two = newCode('RFQ');
  assert.match(one, /^RFQ-\d{4}-[A-F0-9]{6}$/);
  assert.notEqual(one, two);
  assert.ok(one.length <= 20);
});
