export function workshopController(service) {
  const data = (res, value, status = 200) => res.status(status).json({ data: value })
  return {
    categories: async (_req, res) => data(res, await service.categories()),
    list: async (req, res) => res.json(await service.list(req.validated.query)),
    suggest: async (req, res) => data(res, await service.suggest(req.validated.query.q ?? '')),
    map: async (req, res) => data(res, await service.map(req.validated.query.isOpenForVisit)),
    detail: async (req, res) => data(res, await service.detail(req.validated.params.slug)),
    own: async (req, res) => data(res, await service.own(req.user.id)),
    update: async (req, res) => {
      await service.update(req.user.id, req.validated.body)
      return data(res, await service.own(req.user.id))
    },
    addImages: async (req, res) =>
      data(res, await service.uploadImages(req.user.id, req.files ?? [], req.body ?? {}), 201),
    orderImages: async (req, res) =>
      data(res, await service.orderImages(req.user.id, req.validated.body.ids)),
    addCertificate: async (req, res) =>
      data(res, await service.uploadCertificate(req.user.id, req.file, req.body ?? {}), 201),
    remove: (certificate) => async (req, res) => {
      await service.remove(req.user.id, req.validated.params.id, certificate)
      res.sendStatus(204)
    },
  }
}
