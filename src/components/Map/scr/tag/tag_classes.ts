import { osmLifecyclePrefixes, osmPathHighwayTagValues, osmPavedTags, osmSemipavedTags } from './tags'

export function svgTagClasses() {
  const primaries = [
    'building', 'highway', 'railway', 'waterway', 'aeroway', 'aerialway',
    'piste:type', 'boundary', 'power', 'amenity', 'natural', 'landuse',
    'leisure', 'military', 'place', 'man_made', 'route', 'attraction',
    'building:part', 'indoor',
  ]
  const statuses = Object.keys(osmLifecyclePrefixes)
  const secondaries = [
    'oneway', 'bridge', 'tunnel', 'embankment', 'cutting', 'barrier',
    'surface', 'tracktype', 'footway', 'crossing', 'service', 'sport',
    'public_transport', 'location', 'parking', 'golf', 'type', 'leisure',
    'man_made', 'indoor', 'construction', 'proposed',
  ]
  let _tags = function (entity: any) {
    return entity.properties
  }

  const tagClasses = function (entity: any) {
    const t = _tags(entity)

    const computed = tagClasses.getClassesString(t)

    return computed || ''
  }

  tagClasses.getClassesString = function (t: any, value?: any) {
    value = value || ''
    let primary, status
    let i, j, k, v

    // in some situations we want to render perimeter strokes a certain way
    let overrideGeometry: any
    if (/\bstroke\b/.test(value)) {
      if (!!t.barrier && t.barrier !== 'no')
        overrideGeometry = 'line'
    }

    // preserve base classes (nothing with `tag-`)
    const classes = value.trim()
      .split(/\s+/)
      .filter((klass: string) => {
        return klass.length && !klass.startsWith('tag-')
      })
      .map((klass: string) => { // special overrides for some perimeter strokes
        return (klass === 'line' || klass === 'area') ? (overrideGeometry || klass) : klass
      })

    // pick at most one primary classification tag..
    for (i = 0; i < primaries.length; i++) {
      k = primaries[i]
      v = t[k]
      if (!v || v === 'no')
        continue

      if (k === 'piste:type') { // avoid a ':' in the class name
        k = 'piste'
      }
      else if (k === 'building:part') { // avoid a ':' in the class name
        k = 'building_part'
      }

      primary = k
      if (statuses.includes(v)) { // e.g. `railway=abandoned`
        status = v
        classes.push(`tag-${k}`)
      }
      else {
        classes.push(`tag-${k}`)
        classes.push(`tag-${k}-${v}`)
      }

      break
    }

    if (!primary) {
      for (i = 0; i < statuses.length; i++) {
        for (j = 0; j < primaries.length; j++) {
          k = `${statuses[i]}:${primaries[j]}` // e.g. `demolished:building=yes`
          v = t[k]
          if (!v || v === 'no')
            continue

          status = statuses[i]
          break
        }
      }
    }

    // add at most one status tag, only if relates to primary tag..
    if (!status) {
      for (i = 0; i < statuses.length; i++) {
        k = statuses[i]
        v = t[k]
        if (!v || v === 'no')
          continue

        if (v === 'yes') { // e.g. `railway=rail + abandoned=yes`
          status = k
        }
        else if (primary && primary === v) { // e.g. `railway=rail + abandoned=railway`
          status = k
        }
        else if (!primary && primaries.includes(v)) { // e.g. `abandoned=railway`
          status = k
          primary = v
          classes.push(`tag-${v}`)
        } // else ignore e.g.  `highway=path + abandoned=railway`

        if (status)
          break
      }
    }

    if (status) {
      classes.push('tag-status')
      classes.push(`tag-status-${status}`)
    }

    // add any secondary tags
    for (i = 0; i < secondaries.length; i++) {
      k = secondaries[i]
      v = t[k]
      if (!v || v === 'no' || k === primary)
        continue
      classes.push(`tag-${k}`)
      classes.push(`tag-${k}-${v}`)
    }

    // For highways, look for surface tagging..
    if ((primary === 'highway' && !osmPathHighwayTagValues[t.highway]) || primary === 'aeroway') {
      let surface = t.highway === 'track' ? 'unpaved' : 'paved'
      for (k in t) {
        v = t[k]
        if (k in osmPavedTags)
          surface = osmPavedTags[k][v] ? 'paved' : 'unpaved'

        if (k in osmSemipavedTags && !!osmSemipavedTags[k][v])
          surface = 'semipaved'
      }
      classes.push(`tag-${surface}`)
    }

    // If this is a wikidata-tagged item, add a class for that..
    const qid = (
      t.wikidata
      || t['flag:wikidata']
      || t['brand:wikidata']
      || t['network:wikidata']
      || t['operator:wikidata']
    )

    if (qid)
      classes.push('tag-wikidata')

    return classes.join(' ')
      .trim()
  }

  tagClasses.tags = function (val: any) {
    if (!arguments.length)
      return _tags
    _tags = val
    return tagClasses
  }

  return tagClasses
}
