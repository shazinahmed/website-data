const drive = require('drive-db')
const _ = require('lodash')

const SHEET = '1_Nyd7nerS-3b3HnIvNrh_1y27B6_R2z7oK2_1ujUKfA'
const SHEET_PATIENT_DATA_TAB = 1

// Post processes the data to normalize field names etc.
const postProcessData = (rawData) => {

  // Check validity of the row.
  const isValidRow = row => {
    if (!row.detectedPrefecture) { return false }
    if (!row.dateAnnounced) { return false }
    return true
  }

  const transformRow = row => {
    const normalizeNumber = n => {
      if (isNaN(parseInt(n))) { return -1 }
      return parseInt(n)
    }

    const unspecifiedToBlank = v => {
      if (v == 'Unspecified') return ''
      return v
    }

    let transformedRow = {
      'patientId': normalizeNumber(row.patientnumber),
      'dateAnnounced': row.dateannounced,
      'ageBracket': normalizeNumber(row.agebracket),
      'gender': unspecifiedToBlank(row.gender),
      'residence': row.residencecityprefecture,
      'detectedCityTown': row.detectedcity,
      'detectedPrefecture': row.detectedprefecture,
      'patientStatus': row.status,
      'notes': row.notes,
      'knownCluster': row.knowncluster,
      'relatedPatients': row.relatedPatients,
      'mhlwPatientNumber': row.mhlworigpatientnumber,
      'prefecturePatientNumber': row.prefecturepatientnumber,
      'cityPrefectureNumber': row.citypatientnumber,
      'prefectureSourceURL': row.prefectureurlauto,
      'charterFlightPassenger': row.charterflightpassenger,
      'cruisePassengerDisembarked': row.cruisepassengerdisembarked,
      'cruisePassengerInfectedOnboard': row.cruisepassengerinfectedonboard,
      'cruiseQuarantineOfficer': row.cruisequarantineofficer,
      'detectedAtPort': row.detectedatport,
      'sourceURL': row.sources,
    }

    // filter empty cells.
    transformedRow = _.pickBy(transformedRow, (v, k) => {
      if (v == '') {
        return false
      }
      return true
    })

    // convert boolean fields
    let booleanFields = [ 
      'charterFlightPassenger', 
      'cruisePassengerDisembarked', 
      'cruisePassengerInfectedOnboard',
      'cruiseQuarantineOfficer',
      'detectedAtPort'
    ]
    transformedRow = _.mapValues(transformedRow, (v, k) => {
      if (booleanFields.indexOf(k) != -1) {
        return (v == '1')
      }
      return v
    })

    // Add a field to indicate whether we count as patient or not.
    transformedRow.confirmedPatient = (transformedRow.patientId > 0)

    return transformedRow
  }
  
  const rows = _.filter(_.map(rawData, transformRow), isValidRow)
  return rows
}


async function fetchPatientData() {
  return drive({sheet: SHEET, tab: SHEET_PATIENT_DATA_TAB})
    .then(db => {
      return postProcessData(db)
    })
}

exports.fetchPatientData = fetchPatientData;