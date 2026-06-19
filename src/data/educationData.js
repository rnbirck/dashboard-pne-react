import { loadJson } from './staticData'

const educationCache = new Map()

function loadEducationJson(path) {
  if (educationCache.has(path)) {
    return Promise.resolve(educationCache.get(path))
  }
  const promise = loadJson(path).then((data) => {
    educationCache.set(path, data)
    return data
  })
  educationCache.set(path, promise)
  return promise
}

export function loadEducationMunicipiosIndex() {
  return loadEducationJson('/data/educacao/municipios_index.json')
}

export function loadEducationMunicipio(idMunicipio) {
  if (!idMunicipio) return Promise.reject(new Error('id_municipio obrigatorio'))
  return loadEducationJson(`/data/educacao/municipios/${idMunicipio}.json`)
}
