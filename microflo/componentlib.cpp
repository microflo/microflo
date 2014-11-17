/* MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Some libraries used in components may be of different license.
 * 
 * --------------------------------------------------------------------
 * This CPP files serves to build a separate component library object
 * file.
 * --------------------------------------------------------------------
 */

// microflo runtime base class declarations and generated component id's (derived from components.json)
#include "components.h"

// get generated component input & outport port definitions (derived from components.json)
#include "components-gen-top.hpp"

// all component implementations (through #INCLUDE collection)
#include "components-gen-lib.hpp"

// createComponent() factory function
#include "components-gen-bottom.hpp"
