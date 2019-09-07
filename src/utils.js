const placeholderCharacter = 'æ'

function parseTrString (str) {
  // return str.split(reverseLookbehind not escape + placeholderCharacter{1})
}

function stringifyTrList (list) {
  return list
    .map(str => str.replace(new RegExp(placeholderCharacter, 'g'), '\\' + placeholderCharacter))
    .join(placeholderCharacter)
}

function astToTrWithRef () {

}

function trToRef () {

}

function getTrObjects (ast) {
  /*

  1. Search for <translate> objects
  2. createTrString() from their sub-AST
  3. Keep reference to sub-AST

  */

}

function applyTr (translation, translated) {

}
