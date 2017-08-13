const test = require('unit.js');

const JsCard = require('../lib/JsCard.js').JsCard;
const CardSet = require('../lib/CardSet.js').CardSet;

test.bool(new CardSet([new JsCard('🂱')]).Equals(new CardSet([new JsCard('🂮')]))).isFalse();
test.bool(new CardSet([new JsCard('🂱')]).Equals(new CardSet([new JsCard('🂱')]))).isTrue();
