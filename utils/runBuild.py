# This python (v3) script generates the beswrpt file to load into web report or ojo file to load into console.
# It combines all of the output into a single file

import os
# from pathlib import Path
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
    print('    Project Path:  ' + project_path)
    print('     Script Path:  ' + script_path)
    config = configparser.ConfigParser()
    if not os.path.isfile(config_path):
        print('No config file found')
        sys.exit('0')

    config.read(config_path)
    build_path = os.path.join(project_path, 'build')
    index_html_path = os.path.join(build_path, 'index.html')
    output_path = os.path.join(project_path, 'output')

    #  create output folder
    if not os.path.exists(output_path):
        os.makedirs(output_path)

    #  create output folder
    # Path(build_path).mkdir(exist_ok=True)

    print('   Output Folder: ' + output_path)
    print(' Index.html path: ' + index_html_path)
    print('')

except Exception as e:
    print('--ERR-- Cannot get input params: ' + str(e))
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

def inject_js_file(js_file, index_data, defer):
    js_file_path = build_path + (js_file if build_path[0] == '/' else js_file.replace('/', '\\'))

    replace_string = '<script ' + ('defer="defer" ' if defer else '') + 'src="' + js_file + '"></script>'

    try:
        with open(js_file_path, 'r') as file:
            js_data = file.read()

        # we are using CDATA tags in the final dashboard or report so we have to escape any that might be in the js file
        js_data = js_data.replace(']]>', ']]]]><![CDATA[>')

        #remove the existsing script tag but add the script at the end as it might be deferred
        index_data = index_data.replace(replace_string, '')
        index_data = index_data.replace('</body></html>', ('<script>' +js_data + '</script></body></html>'))

        print('   Injected file: ' + js_file_path)
        print ('')
        return index_data

    except Exception as e:
        print('--ERR-- Error with file:' + js_file_path + '  ' + str(e))
        sys.exit()
    
def create_output_file(index_data, config_key ):
    try:
        file_name = config[config_key]['FileName']
        app_output_path = os.path.join(output_path, file_name)
        build_type = config[config_key]['Type'] 
        title = config[config_key]['Title']
        
        # Additional dashboard only hooks
        if build_type == 'Dashboard':
            uihoooks_navbar = config[config_key]['NavBar']
            uihoooks_launchtype = config[config_key]['LaunchType']
            uihoooks_requires = config[config_key]['RequiresAuthoring']
            uihoooks_menu = config[config_key]['Menu']
        
        print('       App Title:  ' + title)
        print('        App Type:  ' + build_type)

        template_filepath = os.path.join(config_folder_path, ('WebReportTemplate.beswrpt' if build_type == 'Report' else 'DashboardTemplate.ojo'))
        
        with open(template_filepath, 'r') as file:
            template_data = file.read()

        template_data = template_data.replace('{{title}}', title)
        template_data = template_data.replace('{{buildContents}}', index_data)
        
        if build_type == 'Dashboard':
            template_data = template_data.replace('{{NavBar}}', uihoooks_navbar)
            template_data = template_data.replace('{{LaunchType}}', uihoooks_launchtype)
            template_data = template_data.replace('{{RequiresAuthoring}}', uihoooks_requires)
            template_data = template_data.replace('{{Menu}}', uihoooks_menu)
        
        print('        Metadata:  Added!')

        # write build output
        with open(app_output_path, 'w') as file:
            file.write(template_data)
        
        print('  Output created: ' + app_output_path)
        print('')
        
    except Exception as e:
        print('--ERR-- Error creating output file: '  + str(e))
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
    
    # find and add js files -- new react scripts uses defer="defer", okld ones do not 
    pattern_js = '<script defer="defer" src="([a-zA-Z0-9/.-]*.js)"></script>'
    js_matches = re.findall(pattern_js, index_data)
    defer = True

    if len(js_matches) == 0:
        pattern_js = '<script src="([a-zA-Z0-9/.-]*.js)"></script>'
        js_matches = re.findall(pattern_js, index_data)
        defer = False
            
    for match in js_matches:
            index_data = inject_js_file(match, index_data, defer)

    #  build all apps with their section
    for config_key in config.sections():
        create_output_file(index_data, config_key )

    # cleanup static folder and unnecessary files
    # preform_cleanup()

if __name__ == '__main__':
    main()