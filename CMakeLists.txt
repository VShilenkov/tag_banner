cmake_minimum_required(VERSION 3.16)

project(tag_banner LANGUAGES NONE)

set(BANNER_INPUTS
    "${CMAKE_CURRENT_SOURCE_DIR}/view.html.in"
    "${CMAKE_CURRENT_SOURCE_DIR}/styles.css"
    "${CMAKE_CURRENT_SOURCE_DIR}/categories.js"
    "${CMAKE_CURRENT_SOURCE_DIR}/app.js"
)

set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS ${BANNER_INPUTS})

file(READ "${CMAKE_CURRENT_SOURCE_DIR}/styles.css"    CSS)
file(READ "${CMAKE_CURRENT_SOURCE_DIR}/categories.js" MODEL_JS)
file(READ "${CMAKE_CURRENT_SOURCE_DIR}/app.js"        APP_JS)

configure_file(
    "${CMAKE_CURRENT_SOURCE_DIR}/view.html.in"
    "${CMAKE_CURRENT_BINARY_DIR}/banner.html"
    @ONLY
)

add_custom_target(tag_banner ALL DEPENDS "${CMAKE_CURRENT_BINARY_DIR}/banner.html")