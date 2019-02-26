/**
 * Survey model events
 */

import {EventEmitter} from 'events';
var Survey = require('../../sqldb').Survey;
var SurveyEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
SurveyEvents.setMaxListeners(0);

// Model events
var events = {
  afterCreate: 'save',
  afterUpdate: 'save',
  afterDestroy: 'remove'
};

// Register the event emitter to the model events
function registerEvents(Survey) {
  for(var e in events) {
    let event = events[e];
    Survey.hook(e, emitEvent(event));
  }
}

function emitEvent(event) {
  return function(doc, options, done) {
    SurveyEvents.emit(event + ':' + doc._id, doc);
    SurveyEvents.emit(event, doc);
    done(null);
  };
}

registerEvents(Survey);
export default SurveyEvents;
