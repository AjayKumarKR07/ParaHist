cmake_minimum_required(VERSION 3.16)
project(ParaHist VERSION 1.0 LANGUAGES CXX)

# ── C++ standard ──────────────────────────────────────────────────────────────
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ── Build type default ────────────────────────────────────────────────────────
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

# ── OpenMP ────────────────────────────────────────────────────────────────────
find_package(OpenMP REQUIRED)
if(OpenMP_CXX_FOUND)
  message(STATUS "OpenMP found: version ${OpenMP_CXX_VERSION}")
else()
  message(FATAL_ERROR "OpenMP NOT found.")
endif()

# ── Shared library sources (no main) ─────────────────────────────────────────
set(LIB_SOURCES
  src/csv_reader.cpp
  src/sequential_histogram.cpp
  src/parallel_histogram.cpp
  src/benchmark.cpp
)

# ── parahist — main program ───────────────────────────────────────────────────
add_executable(parahist
  src/main.cpp
  ${LIB_SOURCES}
)
target_include_directories(parahist PRIVATE ${CMAKE_SOURCE_DIR}/src)
target_link_libraries(parahist PRIVATE OpenMP::OpenMP_CXX)
target_compile_options(parahist PRIVATE
  $<$<CXX_COMPILER_ID:GNU,Clang>:-O3 -march=native>
  $<$<CXX_COMPILER_ID:MSVC>:/O2>
)

# ── parabench — benchmark program ────────────────────────────────────────────
add_executable(parabench
  src/bench_main.cpp
  ${LIB_SOURCES}
)
target_include_directories(parabench PRIVATE ${CMAKE_SOURCE_DIR}/src)
target_link_libraries(parabench PRIVATE OpenMP::OpenMP_CXX)
target_compile_options(parabench PRIVATE
  $<$<CXX_COMPILER_ID:GNU,Clang>:-O3 -march=native>
  $<$<CXX_COMPILER_ID:MSVC>:/O2>
)

# ── Output directory ──────────────────────────────────────────────────────────
set_target_properties(parahist parabench PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/build
)

# ── Configuration summary ─────────────────────────────────────────────────────
message(STATUS "ParaHist configuration:")
message(STATUS "  Build type   : ${CMAKE_BUILD_TYPE}")
message(STATUS "  C++ standard : C++${CMAKE_CXX_STANDARD}")
message(STATUS "  Compiler     : ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "  OpenMP flags : ${OpenMP_CXX_FLAGS}")
message(STATUS "  Targets      : parahist, parabench")
