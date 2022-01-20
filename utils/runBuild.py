# This python (v3) script generates the beswrpt file to load into web report or ojo file to load into console.
# It combines all of the output into a single file

import os
from shutil import rmtree
import re
import sys
import configparser

try:
    config_key = 'Config'
    project_path = os.getcwd()
    script_path =  os.path.join(project_path, 'utils')
    config_folder_path = script_path
    config_path = os.path.join(config_folder_path, 'conf.ini')
    print('')
    print('     Script Path:  ' + script_path)
    config = configparser.ConfigParser()
    if not os.path.isfile(config_path):
        print('No config file found')
        sys.exit('0')

    config.read(config_path)
    build_type = config[config_key]['Type'] 
    title = config[config_key]['Title']
    file_name = config[config_key]['FileName']
    
    if build_type == 'Dashboard':
        uihoooks_navbar = config[config_key]['NavBar']
        uihoooks_launchtype = config[config_key]['LaunchType']
        uihoooks_requires = config[config_key]['RequiresAuthoring']
        uihoooks_menu = config[config_key]['Menu']
   
    print('    Project Name:  ' + title)
    print('    Project Type:  ' + build_type)
    print('    Project Path:  ' + project_path)
    print('       File name:  ' + file_name)
    print('')

except Exception as e:
    print('--ERR-- Cannot get input params: ' + str(e))
    sys.exit()

try:
    template_filepath = os.path.join(config_folder_path, ('WebReportTemplate.beswrpt' if build_type == 'Report' else 'DashboardTemplate.ojo'))
    build_path = os.path.join(project_path, 'build')
    index_html_path = os.path.join(build_path, 'index.html')

    print('      Build path: ' + build_path)
    print('   Template path: ' + template_filepath)
    print(' Index.html path: ' + index_html_path)
    print('')
    build_output_path = os.path.join(build_path, file_name)

except Exception as e:
    print('--ERR-- Cannot set basic paths: ' + str(e))
    sys.exit()


def inject_css_file(css_file, index_data):

    css_file_path = build_path + (css_file if build_path[0] == '/' else css_file.replace('/', '\\'))
    replace_string = '<link href="' + css_file + '" rel="stylesheet">'

    try:
        with open(css_file_path, 'r') as file:
            css_data = file.read()
        
        index_data = index_data.replace(replace_string, ('<style>' + css_data + '</style>'))
        print('   Injected file: ' + css_file_path)
        return index_data

    except Exception as e:
        print('--ERR-- Error with file:' + css_file_path + '  ' + str(e))
        sys.exit()


def inject_js_file(js_file, index_data):
    js_file_path = build_path + (js_file if build_path[0] == '/' else js_file.replace('/', '\\'))
    replace_string = '<script defer="defer" src="' + js_file + '">'

    try:
        with open(js_file_path, 'r') as file:
            js_data = file.read()

        # we are using CDATA tags in the final dashboard or report so we have to escape any that might be in the js file
        js_data = js_data.replace(']]>', ']]]]><![CDATA[>')
        index_data = index_data.replace(replace_string, ('<script>' + js_data))
        print('   Injected file: ' + js_file_path)
        return index_data

    except Exception as e:
        print('--ERR-- Error with file:' + js_file_path + '  ' + str(e))
        sys.exit()

def inject_metadata(index_data):
    try:
        with open(template_filepath, 'r') as file:
            template_data = file.read()
        
        # add dashboard specific metadata
        if build_type == 'Dashboard':
            template_data = template_data.replace('placeholder_navbar', uihoooks_navbar)
            template_data = template_data.replace('placeholder_launchtype', uihoooks_launchtype)
            template_data = template_data.replace('placeholder_requires', uihoooks_requires)
            template_data = template_data.replace('placeholder_menu', uihoooks_menu)

        template_data = template_data.replace('{{title}}', title)
        template_data = template_data.replace('{{buildContents}}', index_data)
        
        print('')
        print('  Added Metadata!')
        return template_data

    except Exception as e:
        print('--ERR-- Error adding metadata'   + str(e))
        sys.exit()

def create_output_file (data):
    try:
        # write build output
        with open(build_output_path, 'w') as file:
            file.write(data)
        
        print('  Output created: ' + build_output_path)
        print('')
        
    except Exception as e:
        print('--ERR-- Error creating output file:'  + str(e))
        sys.exit()

def preform_cleanup():

    try:
        # remove static folder
        static_folder = os.path.join(build_path, 'static')
        rmtree(static_folder)
        
        # remove unnecessary files with known names
        file_list = ['index.html', 'favicon.ico', 'service-worker.js', 'manifest.json', 'robots.txt', 'asset-manifest.json']
        for file in file_list:
            file_path = os.path.join(build_path, file)
            try:
                os.remove(file_path)
            except OSError:
                print('  Issue removing: ' + file_path)
                pass

        # remove precache-manifest file 
        for file in os.listdir(build_path):
            if file.startswith('precache-manifest.'):
                precache_manifest_path = os.path.join(build_path, file)
                try:
                    os.remove(precache_manifest_path)
                except OSError:
                    print('  Issue removing: ' + precache_manifest_path)
                    pass
        
        print('')
        print('    Cleanup done!')
        print('')   
        print(' ----------------------------------- DONE! ----------------------------------- ')
        print('')
        print('') 
        
    except Exception as e:
        print('--ERR-- Could not remove static folder'  + str(e))
        pass


def main():

    # Read in the index file 
    with open(index_html_path, 'r') as index_file:
        index_data = index_file.read()

    # find and add css files 
    pattern_css = '<link href="([a-zA-Z0-9/.]*.css)" rel="stylesheet">'
    css_matches = re.findall(pattern_css, index_data)
    for match in css_matches:
        index_data = inject_css_file(match, index_data)
    
    # find and add js files 
    pattern_js = '<script defer="defer" src="([a-zA-Z0-9/.-]*.js)"></script>'
    js_matches = re.findall(pattern_js, index_data)
    for match in js_matches:
        index_data = inject_js_file(match, index_data)

    # add metadata
    template_data = inject_metadata(index_data)
    create_output_file (template_data)

    # cleanup static folder and unnecessary files
    preform_cleanup()

if __name__ == '__main__':
    main()